<template>
  <article
    class="studio-card studio-card-file"
    :class="{
      'studio-simple': appearanceSetting.isSimpleMode,
      'studio-actions-compact':
        appearanceSetting.actionButtonsDisplayMode === 'compact',
    }"
  >
    <div class="studio-card-main">
      <div
        v-if="appearanceSetting.isShowIcon"
        class="studio-symbol"
        :style="{
          '--studio-icon-fit': iconFit,
          filter: isIconColor ? undefined : 'grayscale(1)',
        }"
        :class="{
          'studio-symbol-blue': getFileCategory(props.file) === 'nodes',
        }"
      >
        <nut-avatar
          v-if="props.file.icon || appearanceSetting.isDefaultIcon"
          :url="rewriteGithubUrl(props.file.icon || icon)"
          :size="44"
        /><UiIconButton
          v-else
          :label="t('studio.preview')"
          :icon="'file-lines'"
          @activate="previewFile"
        />
      </div>
      <div class="studio-card-content">
        <h2>
          <UiButton class="studio-card-title" @click.stop="previewFile">{{
            displayName
          }}</UiButton>
        </h2>
        <p class="studio-card-type">{{ categoryLabel }}</p>
        <p
          v-if="
            !appearanceSetting.isSimpleMode ||
            appearanceSetting.isSimpleShowRemark
          "
          class="studio-card-detail"
        >
          {{ remarkText || nonSimpleSecondLine }}
        </p>
      </div>
    </div>
    <div class="studio-card-footer">
      <span>{{ categoryLabel }}</span>
      <div class="studio-card-actions">
        <UiIconButton
          :label="t('studio.share')"
          icon="share-nodes"
          :disabled="props.disabled"
          v-if="shareBtnVisible"
          @activate="onClickShareLink"
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
        />
      </div>
    </div>
    <div class="studio-card-extra">
      <UiIconButton
        :label="t('studio.preview')"
        icon="eye"
        :disabled="props.disabled"
        @activate="previewFile"
      /><UiIconButton
        :label="t('studio.duplicate')"
        icon="paste"
        :disabled="props.disabled"
        @activate="onClickCopyConfig"
      /><UiIconButton
        :label="t('studio.export')"
        icon="file-export"
        :disabled="props.disabled"
        @activate="onClickExportFile(name)"
      /><UiIconButton
        :label="t('studio.delete')"
        icon="trash-can"
        :disabled="props.disabled"
        danger
        @activate="onClickDelete"
      />
    </div>
  </article>

  <FilePreview
    v-if="filePreviewIsVisible"
    :name="name"
    :previewData="previewData"
    :show-refresh="true"
    @closePreview="closePreview"
    @refresh="refreshPreview"
  />
</template>
<script lang="ts" setup>
import { getFileCategory } from "@/utils/fileCategory";
import {
  watchEffect as studioEffect,
  onBeforeUnmount as studioUnmounted,
} from "vue";
import { useStudioStore } from "@/store/studio";
import { useSubsApi } from "@/api/subs";
import { useFilesApi } from "@/api/files";
import logoIcon from "@/assets/icons/logo.png";
import logoRedIcon from "@/assets/icons/logo-red.png";
import { usePopupRoute } from "@/hooks/usePopupRoute";
import { useAppNotifyStore } from "@/store/appNotify";
import { useGlobalStore } from "@/store/global";
import { useSettingsStore } from "@/store/settings";
import { useSubsStore } from "@/store/subs";
import { getString } from "@/utils/flowTransfer";
import { createGithubProxyUrlRewriter } from "@/utils/githubProxy";
import { resolveImageFit } from "@/utils/iconFit";
import { isMobile } from "@/utils/isMobile";
import { openManagedDeleteDialog } from "@/utils/archive";
import FilePreview from "@/views/FilePreview.vue";
import { Dialog, Toast } from "@nutui/nutui";
import dayjs from "dayjs";
import { storeToRefs } from "pinia";
import { computed, ref, toRaw } from "vue";
import { copyText } from "@/utils/clipboard";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { useHostAPI } from "@/hooks/useHostAPI";
import { useBackend } from "@/hooks/useBackend";
import clashmetaIcon from "@/assets/icons/clashmeta_color.png";
import { isMihomoConfigFileType } from "@/utils/fileType";
import { formatPreviewError } from "@/utils/previewError";
import { downloadBlobResponse } from "@/utils/download";

const { t } = useI18n();
const { env } = useBackend();
const isArchiveEnabled = computed(() => {
  return env.value?.feature?.archive;
});

const props = defineProps<{
  type: "sub" | "collection" | "file";
  file?: any;
  sub?: Sub;
  collection?: Collection;
  disabled?: boolean;
  isDualColumn?: boolean;
}>();
// console.log('props.disabled')
// console.log(props.disabled)
let scrollTop = 0;
const filePreviewIsVisible = ref(false);
usePopupRoute(filePreviewIsVisible);
const previewData = ref();
const moreAction = ref();
const swipe = ref();
const swipeIsOpen = ref(false);
const compareData = ref();
const router = useRouter();
const route = useRoute();
const globalStore = useGlobalStore();
const settingsStore = useSettingsStore();
const subsStore = useSubsStore();
const subsApi = useSubsApi();
const filesApi = useFilesApi();
const { appearanceSetting, githubProxy, githubProxyRegex } =
  storeToRefs(settingsStore);
const {
  isFlowFetching,
  // isSimpleMode,
  // isLeftRight,
  // isIconColor,
  // isSimpleReicon,
  // isDefaultIcon
} = storeToRefs(globalStore);

const displayName =
  props[props.type].displayName ||
  props[props.type]["display-name"] ||
  props[props.type].name;

const name = props[props.type].name;
const tag = props[props.type].tag;
const remark = props[props.type].remark;
const remarkText = computed(() => {
  if (remark) {
    return remark;
  } else {
    return "";
  }
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
const { flows } = storeToRefs(subsStore);
const icon = computed(() => {
  if (isMihomoConfigFileType(props.file.type)) return clashmetaIcon;
  return appearanceSetting.value.isDefaultIcon ? logoIcon : logoRedIcon;
});
const avatarSize = computed(() => {
  if (appearanceSetting.value.isSimpleMode) return "36";
  return props.isDualColumn ? "40" : "48";
});
const itemPadding = computed(() => {
  if (appearanceSetting.value.isSimpleMode) return "9px";
  return props.isDualColumn ? "12px" : "16px";
});
const imageMarginTop = computed(() => {
  if (appearanceSetting.value.isSimpleMode) return "5px";
  return props.isDualColumn ? "2px" : "0";
});
const titleActionTop = computed(() => {
  if (appearanceSetting.value.isSimpleMode) return "8px";
  return props.isDualColumn ? "2px" : "0";
});
const githubUrlRewriter = computed(() => {
  return createGithubProxyUrlRewriter(
    githubProxy.value,
    githubProxyRegex.value,
  );
});
const rewriteGithubUrl = (url?: string | null) => {
  return githubUrlRewriter.value(url);
};
const isIconColor = computed(() => {
  return props.file.isIconColor !== false;
});
const iconFit = computed(() => {
  return resolveImageFit(props.file.iconFit, appearanceSetting.value.iconFit);
});

const collectionDetail = computed(() => {
  const nameList = props?.collection.subscriptions || [];
  if (nameList.length === 0) {
    return t("subPage.collectionItem.noSub");
  } else {
    const displayNameList = nameList.map((name) => {
      const sub = subsStore.getOneSub(name);
      return (
        sub?.displayName || sub?.["display-name"] || sub.name || `${name}(🚫)`
      );
    });
    return `${t("subPage.collectionItem.contain")}：${displayNameList.join(
      "、",
    )}`;
  }
});

const flow = computed(() => {
  if (isMihomoConfigFileType(props.file.type))
    return t("filePage.type.mihomoConfig");
  if (props.file.source === "remote") return t("filePage.source.remote");
  return t("filePage.source.local");
});
const simpleDetailLine = computed(() => {
  if (!shouldInlineRemarkInSecondLine.value) {
    return flow.value;
  }

  return [flow.value, remarkText.value].filter(Boolean).join(" · ");
});
const nonSimpleSecondLine = computed(() => {
  return remarkText.value;
});

const closePreview = () => {
  document.querySelector("html").style["overflow-y"] = "";
  document.querySelector("html").style.height = "";
  document.body.style.height = "";
  document.body.style["overflow-y"] = "";
  (document.querySelector("#app") as HTMLElement).style["overflow-y"] = "";
  (document.querySelector("#app") as HTMLElement).style.height = "";

  filePreviewIsVisible.value = false;

  window.scrollTo({
    top: scrollTop,
    behavior: "instant" as any,
  });

  router.back();
};

const doPreview = async (fileData: any) => {
  Toast.loading("生成中...", { id: "compare", cover: true, duration: 1500 });
  try {
    const res = await subsApi.compareSub("file", fileData);
    if (res?.data?.status === "success") {
      previewData.value = res.data.data;
    } else {
      previewData.value = { processed: formatPreviewError(res) };
    }
  } catch (e) {
    console.error(e);
    previewData.value = { processed: formatPreviewError(e) };
  }
  Toast.hide("compare");
};

const openPreviewPanel = () => {
  scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  globalStore.setSavedPositions(route.path, { left: 0, top: scrollTop });

  document.querySelector("html").style["overflow-y"] = "hidden";
  document.querySelector("html").style.height = "100%";
  document.body.style.height = "100%";
  document.body.style["overflow-y"] = "hidden";
  (document.querySelector("#app") as HTMLElement).style["overflow-y"] =
    "hidden";
  (document.querySelector("#app") as HTMLElement).style.height = "100%";

  filePreviewIsVisible.value = true;
};

const previewFile = async () => {
  await doPreview(props.file);
  openPreviewPanel();
};

const refreshPreview = async () => {
  try {
    const fileRes = await filesApi.getWholeFile(name);
    const latestFile =
      (fileRes?.data?.status === "success" ? fileRes.data.data : null) ??
      props.file;
    await doPreview(latestFile);
    // 同步更新 store，使进入编辑器时数据一致
    subsStore.setOneData("files", name, latestFile);
  } catch (e) {
    console.error(e);
    previewData.value = { processed: formatPreviewError(e) };
    Toast.hide("compare");
  }
};

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

const handleGlobalClick = (event) => {
  const swipeRightEl = document.querySelector(".nut-swipe__right");
  const swipeLeftEl = document.querySelector(".nut-swipe__left");

  if (
    (swipeRightEl && swipeRightEl.contains(event.target)) ||
    (swipeLeftEl && swipeLeftEl.contains(event.target))
  ) {
    return;
  }

  swipe.value?.close();
  swipeIsOpen.value = false;
  if (moreAction.value) moreAction.value.style.transform = "rotate(0deg)";

  document.removeEventListener("click", handleGlobalClick);
};

const ismove = ref(false);

const setIsMoveOpen = () => {
  ismove.value = true;

  setTimeout(() => {
    swipeIsOpen.value = true;
    if (moreAction.value) moreAction.value.style.transform = "rotate(180deg)";
  }, 100);

  setTimeoutTF();
};

const setIsMoveClose = () => {
  ismove.value = true;
  swipeIsOpen.value = false;
  if (moreAction.value) moreAction.value.style.transform = "rotate(0deg)";
  setTimeoutTF();
};

const setTimeoutTF = () => {
  setTimeout(() => {
    ismove.value = false;
  }, 200);
};

const handleContentClick = (event) => {
  event.stopPropagation();

  if (swipeIsOpen.value) {
    swipe.value?.close();
    swipeIsOpen.value = false;
    if (moreAction.value) moreAction.value.style.transform = "rotate(0deg)";
    return;
  }

  if (!ismove.value) {
    previewFile();
  }
};

const onDeleteConfirm = async (mode: DeleteMode = "permanent") => {
  await subsStore.deleteFile(name, mode);
  // Notify.danger(t('subPage.deleteSub.succeedNotify'), { duration: 1500 });
};

const closeExpandedMenu = () => {
  swipe.value?.close();
  swipeIsOpen.value = false;
  if (moreAction.value) moreAction.value.style.transform = "rotate(0deg)";
  document.removeEventListener("click", handleGlobalClick);
};

const onClickCopyConfig = async () => {
  const data = JSON.parse(JSON.stringify(toRaw(props.file)));
  data.name += `-copy${~~(Math.random() * 10000)}`;

  Toast.loading(t("subPage.copyConfigNotify.loading"), { id: "copyConfig" });
  await filesApi.createFile(data);
  await subsStore.fetchSubsData();
  Toast.hide("copyConfig");
  showNotify({ title: t("subPage.copyConfigNotify.succeed") });
  closeExpandedMenu();
};

const onClickEdit = () => {
  router.push(`/edit/${props.type}s/${encodeURIComponent(name)}`);
};

const onClickDelete = () => {
  openManagedDeleteDialog({
    enabled: isArchiveEnabled.value,
    managedTitle: t("archivePage.liveDelete.title"),
    managedContent: t("archivePage.liveDelete.desc", { displayName }),
    managedCancelText: t("archivePage.liveDelete.btn.archive"),
    managedOkText: t("archivePage.liveDelete.btn.permanent"),
    legacyTitle: t("subPage.deleteSub.title"),
    legacyContent: t("subPage.deleteSub.desc", { displayName }),
    legacyCancelText: t("subPage.deleteSub.btn.cancel"),
    legacyOkText: t("subPage.deleteSub.btn.confirm"),
    onArchive: () => onDeleteConfirm("archive"),
    onPermanent: () => onDeleteConfirm("permanent"),
  });
};

const { showNotify } = useAppNotifyStore();
const { currentUrl: host } = useHostAPI();
const emit = defineEmits(["share"]);

const shareBtnVisible = computed(() => {
  return env.value?.feature?.share;
});

const onClickExportFile = async (name: string) => {
  Toast.loading(t("subPage.exportConfigNotify.loading"), {
    id: "exportConfig",
  });
  try {
    downloadBlobResponse(
      await filesApi.exportFile(name),
      `sub-store_file_${name}.json`,
    );
    showNotify({ title: t("subPage.exportConfigNotify.succeed") });
  } catch (e) {
    console.error(e);
    showNotify({
      type: "danger",
      title: t("subPage.exportConfigNotify.failed", {
        e: e instanceof Error ? e.message : e,
      }),
    });
  } finally {
    Toast.hide("exportConfig");
    closeExpandedMenu();
  }
};

const onClickShareLink = async () => {
  console.log("props", props);
  const type = props.type;
  const data = props.file;
  emit("share", data, type);
};
const onClickCopyLink = async () => {
  const path = `/api/file/${encodeURIComponent(name)}`;
  const url = `${host.value}${path}`;

  try {
    await copyText(url);
    showNotify({ title: t("filePage.copyNotify.succeed", { path }) });
  } catch (error) {
    Toast.fail(
      t("filePage.copyNotify.failed", { e: error?.message ?? String(error) }),
    );
  }
};

const categoryLabel = computed(() =>
  t("studio." + getFileCategory(props.file)),
);
const studio = useStudioStore();
const studioKey = "file" + ":" + name;
studioEffect(() => {
  studio.resources[studioKey] = {
    tags: tag || [],
    name: String(displayName),
    actions: [
      {
        label: t("studio.preview"),
        icon: "eye",
        run: previewFile,
        danger: false,
      },
      {
        label: t("studio.duplicate"),
        icon: "paste",
        run: onClickCopyConfig,
        danger: false,
      },
      {
        label: t("studio.export"),
        icon: "file-export",
        run: () => onClickExportFile(name),
        danger: false,
      },
      {
        label: t("studio.delete"),
        icon: "trash-can",
        run: onClickDelete,
        danger: true,
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
  line-height: 1.4;
  margin-left: auto;
  margin-right: auto;
  border-radius: var(--item-card-radios);
  display: flex;
  min-width: 0;
  background: var(--card-color);
  cursor: pointer;
  position: relative;
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

  > .sub-item-content {
    flex: 1;
    min-width: 0;
    line-height: 1.6;
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
        vertical-align: middle;
      }
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
      .compare-sub-link,
      .public-link-action,
      .copy-sub-link,
      .refresh-sub-flow {
        background-color: transparent;
        border: none;
        padding: 11px 6px;
        margin: -11px 0;
        cursor: pointer;
        display: inline-flex;
        justify-content: center;
        align-items: center;

        svg {
          width: 16px;
          height: 16px;
          color: var(--comment-text-color);
        }
      }

      button {
        white-space: nowrap;
      }
    }

    .sub-item-actions {
      position: relative;
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .sub-item-detail {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      word-wrap: break-word;
      word-break: break-all;
      overflow: hidden;
      margin-top: 4px;
      font-size: 12px;
      color: var(--comment-text-color);

      span {
        display: block;
        line-height: 1.8;
      }
    }
    .sub-item-remark {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      word-wrap: break-word;
      word-break: break-all;
      overflow: hidden;
      margin-top: 4px;
      font-size: 12px;
      color: var(--comment-text-color);

      span {
        display: block;
        line-height: 1.5;
      }
    }

    .sub-item-detail-isSimple {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      word-wrap: break-word;
      word-break: break-all;
      overflow: hidden;
      font-size: 12px;
      // margin-top: 3.5px;
      max-width: 80%;
      color: var(--comment-text-color);
    }
  }
}

.sub-item-swipe.is-dual-column {
  .sub-item-wrapper {
    :deep(.nut-avatar) {
      margin-right: 12px;
    }

    > .sub-item-content {
      .sub-item-title-wrapper {
        align-items: flex-start;
        gap: 6px;
      }

      .sub-item-title {
        font-size: 15px;
      }

      .compare-sub-link,
      .public-link-action,
      .copy-sub-link,
      .refresh-sub-flow {
        padding: 11px 6px;
        margin: -11px 0;
      }

      .sub-item-detail {
        -webkit-line-clamp: 1;
      }

      .sub-item-remark {
        -webkit-line-clamp: 1;
      }

      .dual-non-simple-second-line {
        min-height: 18px;
      }

      .sub-item-detail-isSimple {
        max-width: 100%;
      }
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

.desc-about {
  display: block;
  padding: 100px 30px 350px;
  color: var(--comment-text-color);
  font-size: 12px;
  line-height: 20px;
  margin-top: 8px;
  margin-bottom: 20px;
  text-align: left;
}

.desc-about span {
  display: inline-block;
  padding: 6px 0 0 0;
}

.desc-title a,
.desc-about a {
  color: var(--primary-color);
}

.subs-list-wrapper {
  margin-bottom: 36px;
  position: relative;
}

.sub-img-wrappers {
  display: flex;
  align-items: center;
}
</style>
