<template>
  <article
    class="studio-card studio-card-artifact"
    :class="{ 'studio-simple': appearanceSetting.isSimpleMode }"
  >
    <div class="studio-card-main">
      <div
        v-if="appearanceSetting.isShowIcon"
        class="studio-symbol"
        :style="{
          '--studio-icon-fit': iconFit,
          filter: isIconColor ? undefined : 'grayscale(1)',
        }"
        :class="{ 'studio-symbol-blue': false }"
      >
        <nut-avatar
          v-if="artifact.icon || appearanceSetting.isDefaultIcon"
          :url="displayIcon"
          :size="44"
        /><UiIconButton
          v-else
          :label="t('studio.preview')"
          :icon="'globe'"
          @activate="openUrl"
        />
      </div>
      <div class="studio-card-content">
        <h2>
          <UiButton class="studio-card-title" @click.stop="openUrl">{{
            displayName
          }}</UiButton>
        </h2>
        <p class="studio-card-type">{{ artifact.platform }}</p>
        <p
          v-if="
            !appearanceSetting.isSimpleMode ||
            appearanceSetting.isSimpleShowRemark
          "
          class="studio-card-detail"
        >
          {{ remarkText || nonSimpleDetailSecondLine }}
        </p>
      </div>
    </div>
    <div class="studio-card-footer">
      <span>{{ artifact.platform }}</span>
      <div class="studio-card-actions">
        <UiIconButton
          :label="t('studio.upload')"
          icon="cloud-arrow-up"
          :disabled="props.disabled"
          @activate="onClickSync"
        /><UiIconButton
          :label="t('studio.copy')"
          icon="clone"
          :disabled="props.disabled"
          @activate="onClickCopyLink"
        /><UiIconButton
          :label="t('studio.edit')"
          icon="pen-nib"
          :disabled="props.disabled"
          @activate="onClickEdit"
        /><UiIconButton
          :label="t('studio.delete')"
          icon="trash-can"
          :disabled="props.disabled"
          danger
          @activate="onClickDelete"
        />
      </div>
    </div>
  </article>
</template>
<script lang="ts" setup>
import {
  watchEffect as studioEffect,
  onBeforeUnmount as studioUnmounted,
} from "vue";
import { useStudioStore } from "@/store/studio";
import { useAppNotifyStore } from "@/store/appNotify";
import { useArtifactsStore } from "@/store/artifacts";
import { useSettingsStore } from "@/store/settings";
import { useSubsStore } from "@/store/subs";
import { butifyDate } from "@/utils/butifyDate";
import { resolveArtifactIcon } from "@/utils/artifactIcon";
import { createGithubProxyUrlRewriter } from "@/utils/githubProxy";
import { resolveImageFit } from "@/utils/iconFit";
import { isMobile } from "@/utils/isMobile";
import { Dialog, Toast } from "@nutui/nutui";
import { storeToRefs } from "pinia";
import { computed, ref, toRaw, watch, watchEffect } from "vue";
import { copyText } from "@/utils/clipboard";
import { useI18n } from "vue-i18n";
import { useGlobalStore } from "@/store/global";
import { useHostAPI } from "@/hooks/useHostAPI";
import { useBackend } from "@/hooks/useBackend";
import { openManagedDeleteDialog } from "@/utils/archive";
const globalStore = useGlobalStore();

const { t } = useI18n();
const { currentUrl: host } = useHostAPI();
const { env } = useBackend();
const isArchiveEnabled = computed(() => {
  return env.value?.feature?.archive;
});

const props = defineProps<{
  name: string;
  disabled?: boolean;
  isDualColumn?: boolean;
}>();

const { showNotify } = useAppNotifyStore();
const subsStore = useSubsStore();
const artifactsStore = useArtifactsStore();
const settingsStore = useSettingsStore();
const { appearanceSetting, githubProxy, githubProxyRegex } =
  storeToRefs(settingsStore);
const { artifacts } = storeToRefs(artifactsStore);
const artifact = computed(() => {
  return artifacts.value.find((item) => item.name === props.name);
});
const emit = defineEmits(["edit"]);
const artifactUrl = computed(() => {
  return artifact.value?.upload === false ? "" : artifact.value?.url || "";
});

const displayName = computed(() => {
  return (
    artifact.value.displayName ||
    artifact.value["display-name"] ||
    artifact.value.name
  );
});
const tag = computed(() => artifact.value?.tag || []);
const remark = computed(() => artifact.value?.remark || "");
const remarkText = computed(() => {
  if (remark.value) {
    return remark.value;
  }
  return "";
});
const shouldInlineRemarkInSecondLine = computed(() => {
  return Boolean(
    props.isDualColumn &&
    appearanceSetting.value.isSimpleMode &&
    remarkText.value &&
    appearanceSetting.value.isSimpleShowRemark,
  );
});
const isDualNonSimpleMode = computed(() => {
  return Boolean(props.isDualColumn && !appearanceSetting.value.isSimpleMode);
});
const avatarSize = computed(() => {
  if (appearanceSetting.value.isSimpleMode) return "36";
  return props.isDualColumn ? "40" : "48";
});
const itemPadding = computed(() => {
  if (appearanceSetting.value.isSimpleMode) return "9px";
  return props.isDualColumn ? "12px" : "16px";
});

const isInit = ref(false);
const isSyncOpen = ref(false);
const isSwitcherLoading = ref(false);
const moreAction = ref();
const swipe = ref();
const swipeIsOpen = ref(false);

const sourceSub = computed(() => {
  const name = artifact.value.source;
  switch (artifact.value.type) {
    case "collection":
      return subsStore.getOneCollection(name);
    case "subscription":
      return subsStore.getOneSub(name);
    case "file":
      return subsStore.getOneFile(name);
  }
});
const isIconColor = computed(() => {
  return artifact.value.isIconColor !== false;
});
const iconFit = computed(() => {
  return resolveImageFit(
    artifact.value?.iconFit,
    appearanceSetting.value.iconFit,
  );
});

const icon = computed(() => {
  return resolveArtifactIcon({
    artifact: artifact.value,
    isDefaultIcon: appearanceSetting.value.isDefaultIcon,
    sourceIcon: sourceSub.value?.icon,
  });
});
const githubUrlRewriter = computed(() => {
  return createGithubProxyUrlRewriter(
    githubProxy.value,
    githubProxyRegex.value,
  );
});
const displayIcon = computed(() => {
  return githubUrlRewriter.value(icon.value) || icon.value;
});

const sourceUrl = computed(() => {
  if (!artifact.value.type) {
    return "";
  }
  if (artifact.value.type === "file") {
    const path = `/api/file/${encodeURIComponent(artifact.value.source)}`;
    const url = `${host.value}${path}`;
    return url;
  }
  const query = new URLSearchParams();
  if (artifact.value.platform !== null) {
    query.set("target", artifact.value.platform);
  }
  if (artifact.value.includeUnsupportedProxy) {
    query.set("includeUnsupportedProxy", "true");
  }
  if (artifact.value.prettyYaml) {
    query.set("prettyYaml", "true");
  }
  const queryString = query.toString();
  return `${host.value}/download/${
    artifact.value.type === "subscription" ? "" : "collection/"
  }${encodeURIComponent(
    artifact.value.source,
  )}${queryString ? `?${queryString}` : ""}`;
});

const openUrl = () => {
  if (artifactUrl.value) {
    window.open(artifactUrl.value);
  }
};

const ismove = ref(false);

const setIsMoveOpen = () => {
  ismove.value = true;

  setTimeout(() => {
    swipeIsOpen.value = true;
    if (moreAction.value) moreAction.value.style.transform = "rotate(180deg)";

    setTimeout(() => {
      document.addEventListener("click", handleGlobalClick);
    }, 10);
  }, 100);

  setTimeoutTF();
};

const setIsMoveClose = () => {
  ismove.value = true;
  swipeIsOpen.value = false;
  if (moreAction.value) moreAction.value.style.transform = "rotate(0deg)";

  document.removeEventListener("click", handleGlobalClick);

  setTimeoutTF();
};

// 增加延迟防止打开时 触发不了
const setTimeoutTF = () => {
  setTimeout(() => {
    ismove.value = false;
  }, 200);
};

const handleGlobalClick = (event: MouseEvent) => {
  const swipeRightEl = document.querySelector(".nut-swipe__right");
  const swipeLeftEl = document.querySelector(".nut-swipe__left");

  if (
    (swipeRightEl && swipeRightEl.contains(event.target as Node)) ||
    (swipeLeftEl && swipeLeftEl.contains(event.target as Node))
  ) {
    return;
  }

  swipe.value?.close();
  swipeIsOpen.value = false;
  if (moreAction.value) moreAction.value.style.transform = "rotate(0deg)";

  document.removeEventListener("click", handleGlobalClick);
};

const handleContentClick = (event: MouseEvent) => {
  event.stopPropagation();

  if (swipeIsOpen.value) {
    swipe.value?.close();
    swipeIsOpen.value = false;
    if (moreAction.value) moreAction.value.style.transform = "rotate(0deg)";
    return;
  }

  if (!ismove.value && sourceUrl.value) {
    openPreviewSource();
  }
};

const openPreviewSource = () => {
  if (ismove.value || !sourceUrl.value) return;
  Dialog({
    title: t("tabBar.sub"),
    content: sourceUrl.value,
    onCancel: () => {},
    onOk: () => {
      window.open(sourceUrl.value);
    },
    onOpened: () => swipe.value?.close(),
    popClass: "auto-dialog",
    okText: t("editorPage.subConfig.basic.previewSwitch"),
    closeOnPopstate: true,
    lockScroll: false,
  });
};

const transferText = (type: string) => {
  const transType = () => {
    switch (artifact.value.type) {
      case "subscription":
        return t("specificWord.singleSub");
      case "collection":
        return t("specificWord.collectionSub");
      case "file":
        return t("specificWord.file");
      default:
        return t("specificWord.unknownType");
    }
  };

  const transTime = () => {
    if (appearanceSetting.value.isSimpleMode) {
      return artifact.value.updated ? butifyDate(artifact.value.updated) : "";
    } else {
      return artifact.value.updated
        ? t(`syncPage.detail.secondLine`, {
            time: butifyDate(artifact.value.updated),
          })
        : t(`syncPage.detail.notSync`);
    }
  };

  switch (type) {
    case "type":
      return transType();
    case "time":
      return transTime();
  }
};

const detail = computed(() => {
  const name = sourceSub.value
    ? sourceSub.value?.displayName ||
      sourceSub.value?.["display-name"] ||
      sourceSub.value?.name
    : artifact.value.source
      ? `${artifact.value.source}(🚫)`
      : t("specificWord.unknownSource");
  const type = transferText("type") || "";
  if (appearanceSetting.value.isSimpleMode) {
    return {
      firstLine: "",
      secondLine: type + " " + name + " " + transferText("time"),
    };
  } else {
    return {
      firstLine: t(`syncPage.detail.firstLine`, {
        type,
        name,
      }),
      secondLine: transferText("time"),
    };
  }
});
const simpleDetailSecondLine = computed(() => {
  if (!shouldInlineRemarkInSecondLine.value) {
    return detail.value.secondLine;
  }

  return [detail.value.secondLine, remarkText.value]
    .filter(Boolean)
    .join(" · ");
});
const nonSimpleDetailSecondLine = computed(() => {
  return [detail.value.secondLine, remarkText.value]
    .filter(Boolean)
    .join(" · ");
});

const swipeController = () => {
  if (swipeIsOpen.value) {
    swipe.value?.close();
    swipeIsOpen.value = false;
    if (moreAction.value) moreAction.value.style.transform = "rotate(0deg)";

    document.removeEventListener("click", handleGlobalClick);
  } else {
    if (appearanceSetting.value.isLeftRight) {
      swipe.value?.open("right");
      setTimeout(() => {
        swipeIsOpen.value = true;
        setTimeout(() => {
          document.addEventListener("click", handleGlobalClick);
        }, 10);
      }, 100);
    } else {
      swipe.value?.open("left");
      setTimeout(() => {
        swipeIsOpen.value = true;
        if (moreAction.value)
          moreAction.value.style.transform = "rotate(180deg)";

        setTimeout(() => {
          document.addEventListener("click", handleGlobalClick);
        }, 10);
      }, 100);
    }
  }
};

const onClickCopyLink = async () => {
  try {
    await copyText(encodeURI(artifactUrl.value));
    showNotify({ title: t("syncPage.copyNotify.succeed"), type: "success" });
  } catch (error) {
    Toast.fail(
      t("syncPage.copyNotify.failed", { e: error?.message ?? String(error) }),
    );
  }
};

const onDeleteConfirm = async (mode: DeleteMode = "permanent") => {
  const shouldShowToast = Boolean(artifactUrl.value);
  if (shouldShowToast) {
    Toast.loading("正在删除...", {
      cover: true,
      id: "delete-toast",
    });
  }

  await artifactsStore.deleteArtifact(artifact.value.name, mode);

  if (shouldShowToast) {
    Toast.hide("delete-toast");
  }
};

const onClickSync = async () => {
  Toast.loading("同步中...", {
    cover: true,
    id: "sync-toast",
  });
  await artifactsStore.syncOneArtifact(artifact.value.name);
  await settingsStore.fetchSettings();
  Toast.hide("sync-toast");
};

const onClickEdit = () => {
  emit("edit", artifact.value);
};

const onClickDelete = () => {
  openManagedDeleteDialog({
    enabled: isArchiveEnabled.value,
    managedTitle: t("archivePage.liveDelete.title"),
    managedContent: [
      t("archivePage.liveDelete.desc", { displayName: displayName.value }),
      t("syncPage.deleteArt.archiveExtra"),
    ].join("\n\n"),
    managedCancelText: t("archivePage.liveDelete.btn.archive"),
    managedOkText: t("archivePage.liveDelete.btn.permanent"),
    legacyTitle: t("syncPage.deleteArt.title"),
    legacyContent: t("syncPage.deleteArt.desc", {
      displayName: displayName.value,
    }),
    legacyCancelText: t("syncPage.deleteArt.btn.cancel"),
    legacyOkText: t("syncPage.deleteArt.btn.confirm"),
    onArchive: () => onDeleteConfirm("archive"),
    onPermanent: () => onDeleteConfirm("permanent"),
  });
};

// 初始化开关状态
watchEffect(() => {
  if (!isInit.value && artifact.value.name) {
    isSyncOpen.value = artifact.value.sync;
    isInit.value = true;
  } else {
  }
});

// 切换开关修改数据
watch(isSyncOpen, async () => {
  if (!isInit.value) return;
  isSwitcherLoading.value = true;
  const data = toRaw(artifact.value);
  data.sync = !artifact.value.sync;
  await artifactsStore.editArtifact(artifact.value.name, data);
  isSwitcherLoading.value = false;
});

const studio = useStudioStore();
const studioKey = "artifact" + ":" + artifact.value.name;
studioEffect(() => {
  studio.resources[studioKey] = {
    name: String(displayName.value),
    controls: [
      {
        label: t("syncPage.syncSwitcher"),
        get: () => isSyncOpen.value,
        set: (value) => (isSyncOpen.value = value),
        disabled: () => isSwitcherLoading.value,
      },
    ],
    actions: [
      { label: t("studio.preview"), icon: "eye", run: openUrl, danger: false },
      {
        label: t("studio.upload"),
        icon: "cloud-arrow-up",
        run: onClickSync,
        danger: false,
      },
      {
        label: t("studio.source"),
        icon: "link",
        run: openPreviewSource,
        danger: false,
      },
    ],
  };
});
studioUnmounted(() => delete studio.resources[studioKey]);
</script>

<style lang="scss" scoped>
.sub-item-customer-icon {
  :deep(img) {
    & {
      opacity: 0.8;
      filter: brightness(var(--img-brightness));
    }
  }
}

.sub-item-wrapper {
  line-height: 1.6;
  // width: calc(100% - 24px);
  margin-left: auto;
  margin-right: auto;
  border-radius: var(--item-card-radios);
  // padding: var(--safe-area-side);
  display: flex;
  flex-direction: row; //
  justify-content: flex-end; //
  min-width: 0;
  background: var(--card-color);
  cursor: pointer;
  overflow: hidden;

  :deep(.nut-avatar) {
    flex-shrink: 0;
    width: 56px;
    height: 56px;
    margin-right: 15px;
    border-radius: 12px;

    img {
      object-fit: var(--icon-fit, cover);
      border-radius: 10px;
    }
  }

  .sub-item-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;

    .sub-item-title-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2px;

      .sub-item-title {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 3px;
        white-space: nowrap;
        overflow: hidden;
        font-size: 16px;
        color: var(--primary-text-color);

        .sub-item-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tag {
          display: inline-flex;
          flex: 0 0 auto;
          margin: 0 1px;

          :deep(.nut-tag) {
            padding: 2px 3px;
            font-size: 11px;
            line-height: 1.2;
          }
        }
      }

      .title-right-wrapper {
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
      }
    }

    .sub-item-detail {
      word-wrap: break-word;
      // margin-top: 3.5px;
      font-size: 12px;

      .second-line-wrapper {
        width: 100%;
        display: flex;
        align-items: flex-start;

        > p {
          flex: 1 1 auto;
          min-width: 0;
          padding-right: 8px;
        }

        .task-switch {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          flex-direction: row;
          justify-content: flex-end; // ios 14
          margin-left: auto;

          .simple-actions {
            display: flex;
            align-items: center;
            flex-shrink: 0;
          }

          span {
            margin-right: 6px;
            font-weight: normal;
            // line-height: 2.8;
            color: var(--comment-text-color);
          }
          .switch-label {
            flex-shrink: 0;
          }

          .my-switch {
            height: 22px;
            width: 45px;
            min-width: 40px;

            :deep(.switch-button) {
              width: 18px;
              height: 18px;
            }
          }
        }
      }

      p {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        word-break: break-all;
        line-height: 1.8;
      }

      color: var(--comment-text-color);
    }

    .sub-item-remark {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      word-break: break-all;
      line-height: 1.8;
      font-size: 12px;
      color: var(--comment-text-color);
      margin-top: 2px;
    }
  }
}

.sub-item-swipe {
  display: block;
  min-width: 0;
  :deep(.nut-swipe__left) {
    .sub-item-swipe-btn-wrapper {
      padding-left: 24px;
    }
  }

  :deep(.nut-swipe__right),
  :deep(.nut-swipe__left) {
    display: flex;
    justify-content: space-around;
    align-items: center;

    .sub-item-swipe-btn-wrapper {
      padding-left: 14px;

      &:last-child {
        padding-right: 14px;
      }

      .sub-item-swipe-btn {
        border-radius: 50%;
        height: 46px;
        width: 44px;
      }
    }
  }
}

.sub-item-swipe.is-dual-column {
  .sub-item-wrapper {
    :deep(.nut-avatar) {
      margin-right: 12px;
    }

    .sub-item-content {
      .sub-item-title-wrapper {
        align-items: flex-start;
        gap: 6px;
      }

      .sub-item-title {
        font-size: 15px;
      }

      .sub-item-detail {
        .second-line-wrapper {
          gap: 2px;
        }

        p {
          -webkit-line-clamp: 1;
        }
      }

      .sub-item-remark {
        -webkit-line-clamp: 1;
      }

      .dual-non-simple-second-line {
        min-height: 18px;
      }
    }
  }
}

.copy-sub-link {
  background-color: transparent;
  border: none;
  padding: 11px 6px;
  margin: -11px 0;
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  // margin-left: 12px;

  svg {
    width: 16px;
    height: 16px;
    color: var(--comment-text-color);
  }
}
.sub-img-wrappers {
  display: flex;
  align-items: center;
}
</style>
