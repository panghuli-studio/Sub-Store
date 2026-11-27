<template>
  <article
    class="studio-card studio-card-archive"
    :class="{ 'studio-simple': appearanceSetting.isSimpleMode }"
  >
    <div class="studio-card-main">
      <div
        v-if="appearanceSetting.isShowIcon"
        class="studio-symbol"
        :style="{
          '--studio-icon-fit': itemIconFit,
          filter: isIconColor ? undefined : 'grayscale(1)',
        }"
        :class="{ 'studio-symbol-blue': false }"
      >
        <nut-avatar
          v-if="
            props.data.snapshot?.icon ||
            artifactSourceIcon ||
            appearanceSetting.isDefaultIcon
          "
          :url="displayItemIcon"
          :size="44"
        /><UiIconButton
          v-else
          :label="t('studio.restore')"
          :icon="'box-archive'"
          @activate="emit('restore', props.data)"
        />
      </div>
      <div class="studio-card-content">
        <h2>
          <UiButton
            class="studio-card-title"
            @click.stop="emit('restore', props.data)"
            >{{ displayName }}</UiButton
          >
        </h2>
        <p class="studio-card-type">
          {{ t("specificWord." + getArchiveTypeLabelKey(itemType)) }}
        </p>
        <p
          v-if="
            !appearanceSetting.isSimpleMode ||
            appearanceSetting.isSimpleShowRemark
          "
          class="studio-card-detail"
        >
          {{ archiveTimeLine }}
        </p>
      </div>
    </div>
    <div class="studio-card-footer">
      <span>{{ t("tabBar.archive") }}</span>
      <div class="studio-card-actions">
        <UiIconButton
          :label="t('studio.restore')"
          icon="reply"
          :disabled="props.disabled"
          @activate="emit('restore', props.data)"
        /><UiIconButton
          :label="t('studio.delete')"
          icon="trash-can"
          :disabled="props.disabled"
          danger
          @activate="emit('delete', props.data)"
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
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";

import logoIcon from "@/assets/icons/logo.png";
import logoRedIcon from "@/assets/icons/logo-red.png";
import { useSettingsStore } from "@/store/settings";
import { useSubsStore } from "@/store/subs";
import { resolveArtifactIcon } from "@/utils/artifactIcon";
import { createGithubProxyUrlRewriter } from "@/utils/githubProxy";
import { resolveImageFit } from "@/utils/iconFit";
import { isShareType, resolveShareDisplayIconState } from "@/utils/share";
import {
  formatArchiveTime,
  getArchiveEntryDisplayName,
  getArchiveTypeLabelKey,
} from "@/utils/archive";

const props = defineProps<{
  data: ArchiveEntry;
  disabled?: boolean;
  isDualColumn?: boolean;
}>();

const emit = defineEmits(["restore", "delete"]);

const { t } = useI18n();
const settingsStore = useSettingsStore();
const subsStore = useSubsStore();
const { appearanceSetting, githubProxy, githubProxyRegex } =
  storeToRefs(settingsStore);
const itemPadding = computed(() => {
  if (appearanceSetting.value.isSimpleMode) return "10px 12px";
  return props.isDualColumn ? "12px" : "14px 16px";
});

const displayName = computed(() => getArchiveEntryDisplayName(props.data));
const remark = computed(() => props.data?.remark || "");
const shouldInlineRemarkInSecondLine = computed(() => {
  return Boolean(
    props.isDualColumn &&
    appearanceSetting.value.isSimpleMode &&
    remark.value &&
    appearanceSetting.value.isSimpleShowRemark,
  );
});
const isDualNonSimpleMode = computed(() => {
  return Boolean(props.isDualColumn && !appearanceSetting.value.isSimpleMode);
});
const tags = computed(() => props.data?.tag || []);
const itemType = computed(() => props.data?.itemType);
const shareType = computed(() => props.data?.shareType);
const archivedAt = computed(() => formatArchiveTime(props.data?.archivedAt));
const icon = computed(() => {
  return appearanceSetting.value.isDefaultIcon ? logoIcon : logoRedIcon;
});
const shareSnapshot = computed(() => {
  return itemType.value === "share" ? props.data?.snapshot : null;
});
const shareSourceType = computed(() => {
  const snapshotType = shareSnapshot.value?.type;
  if (isShareType(snapshotType)) {
    return snapshotType;
  }
  return isShareType(shareType.value) ? shareType.value : null;
});
const shareSourceName = computed(() => {
  return typeof shareSnapshot.value?.name === "string"
    ? shareSnapshot.value.name
    : "";
});
const shareSourceItem = computed(() => {
  if (!shareSourceType.value || !shareSourceName.value) {
    return null;
  }

  switch (shareSourceType.value) {
    case "sub":
      return subsStore.getOneSub(shareSourceName.value) || null;
    case "col":
      return subsStore.getOneCollection(shareSourceName.value) || null;
    case "file":
      return subsStore.getOneFile(shareSourceName.value) || null;
    default:
      return null;
  }
});
const shareIconState = computed(() => {
  return resolveShareDisplayIconState({
    share: shareSnapshot.value,
    source: shareSourceItem.value,
    fallbackIcon: icon.value,
  });
});
const artifactSnapshot = computed(() => {
  return itemType.value === "artifact" ? props.data?.snapshot : null;
});
const artifactSourceItem = computed(() => {
  if (itemType.value !== "artifact" || !artifactSnapshot.value?.source) {
    return null;
  }

  switch (artifactSnapshot.value.type) {
    case "collection":
      return subsStore.getOneCollection(artifactSnapshot.value.source);
    case "subscription":
      return subsStore.getOneSub(artifactSnapshot.value.source);
    case "file":
      return subsStore.getOneFile(artifactSnapshot.value.source);
    default:
      return null;
  }
});
const artifactSourceIcon = computed(() => {
  if (
    itemType.value !== "artifact" ||
    artifactSnapshot.value?.type !== "file" ||
    !artifactSnapshot.value?.source
  ) {
    return null;
  }

  return subsStore.getOneFile(artifactSnapshot.value.source)?.icon || null;
});
const artifactSourceType = computed(() => {
  switch (artifactSnapshot.value?.type) {
    case "subscription":
      return t("specificWord.singleSub");
    case "collection":
      return t("specificWord.collectionSub");
    case "file":
      return t("specificWord.file");
    default:
      return t("specificWord.unknownType");
  }
});
const artifactSourceName = computed(() => {
  const sourceItem = artifactSourceItem.value;

  if (sourceItem) {
    return (
      sourceItem.displayName || sourceItem["display-name"] || sourceItem.name
    );
  }

  return artifactSnapshot.value?.source
    ? `${artifactSnapshot.value.source}(🚫)`
    : t("specificWord.unknownSource");
});

const itemIcon = computed(() => {
  switch (itemType.value) {
    case "sub":
      return props.data?.snapshot?.icon || icon.value;
    case "col":
      return props.data?.snapshot?.icon || icon.value;
    case "file":
      return props.data?.snapshot?.icon || icon.value;
    case "artifact":
      return resolveArtifactIcon({
        artifact: artifactSnapshot.value,
        isDefaultIcon: appearanceSetting.value.isDefaultIcon,
        sourceIcon: artifactSourceIcon.value,
      });
    case "share":
      return shareIconState.value.icon;
    default:
      return icon.value;
  }
});
const githubUrlRewriter = computed(() => {
  return createGithubProxyUrlRewriter(
    githubProxy.value,
    githubProxyRegex.value,
  );
});
const displayItemIcon = computed(() => {
  return githubUrlRewriter.value(itemIcon.value) || itemIcon.value;
});

const isIconColor = computed(() => {
  if (itemType.value === "share") {
    return shareIconState.value.isIconColor;
  }

  return props.data?.snapshot?.isIconColor !== false;
});
const itemIconFit = computed(() => {
  if (itemType.value === "share") {
    return resolveImageFit(
      shareIconState.value.iconFit,
      appearanceSetting.value.iconFit,
    );
  }

  return resolveImageFit(
    props.data?.snapshot?.iconFit,
    appearanceSetting.value.iconFit,
  );
});

const detailParts = computed(() => {
  if (itemType.value === "artifact") {
    return appearanceSetting.value.isSimpleMode
      ? [artifactSourceType.value, artifactSourceName.value]
      : [
          t("syncPage.detail.firstLine", {
            type: artifactSourceType.value,
            name: artifactSourceName.value,
          }),
        ];
  }

  if (
    itemType.value === "sub" ||
    itemType.value === "col" ||
    itemType.value === "file"
  ) {
    return [];
  }

  const parts = [t(`specificWord.${getArchiveTypeLabelKey(itemType.value)}`)];

  if (itemType.value === "share" && shareType.value) {
    parts.push(t(`specificWord.${getArchiveTypeLabelKey(shareType.value)}`));
  }

  return parts;
});

const archiveTimeLine = computed(() => {
  return archivedAt.value
    ? t("archivePage.entry.archivedAt", {
        time: archivedAt.value,
      })
    : "";
});

const detailLine = computed(() => {
  if (
    !appearanceSetting.value.isSimpleMode &&
    (itemType.value === "sub" ||
      itemType.value === "col" ||
      itemType.value === "file")
  ) {
    return "";
  }

  const parts = [...detailParts.value];

  if (appearanceSetting.value.isSimpleMode && archivedAt.value) {
    parts.push(archivedAt.value);
  }

  if (itemType.value === "artifact" && appearanceSetting.value.isSimpleMode) {
    const [type, name, time] = parts;
    const sourceText = [type, name].filter(Boolean).join(" ");
    return time ? `${sourceText} · ${time}` : sourceText;
  }

  return parts.join(" · ");
});
const detailLineWithInlineRemark = computed(() => {
  if (!shouldInlineRemarkInSecondLine.value) {
    return detailLine.value;
  }

  return [detailLine.value, remark.value].filter(Boolean).join(" · ");
});
const nonSimplePrimaryLine = computed(() => {
  return detailLine.value || archiveTimeLine.value;
});
const nonSimpleSecondLine = computed(() => {
  if (!detailLine.value) {
    return remark.value;
  }

  return [archiveTimeLine.value, remark.value].filter(Boolean).join(" · ");
});

const studio = useStudioStore();
const studioKey = "archive" + ":" + props.data.id;
studioEffect(() => {
  studio.resources[studioKey] = {
    data: props.data,
    name: String(displayName.value),
    actions: [
      {
        label: t("studio.preview"),
        icon: "eye",
        run: () => emit("restore", props.data),
        danger: false,
      },
    ],
  };
});
studioUnmounted(() => delete studio.resources[studioKey]);
</script>

<style lang="scss" scoped>
.sub-item-wrapper {
  line-height: 1.4;
  margin-left: auto;
  margin-right: auto;
  border-radius: var(--item-card-radios);
  display: flex;
  min-width: 0;
  background: var(--card-color);
  cursor: default;
  overflow: hidden;

  &.disabled {
    opacity: 0.92;
  }
}

.sub-img-wrappers {
  display: flex;
  align-items: center;
}

.archives-item-icon {
  width: 48px;
  height: 48px;
  margin-right: 15px;
  border-radius: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &.simple {
    width: 36px;
    height: 36px;
  }

  &.is-dual-column:not(.simple) {
    width: 40px;
    height: 40px;
    margin-right: 12px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
  }
}

.sub-item-content {
  min-width: 0;
  flex: 1;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
}

.sub-item-title-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2px;
}

.sub-item-title {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  overflow: hidden;
  color: var(--primary-text-color);
  font-size: 16px;
  line-height: 1.4;

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

.sub-item-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.archives-item-actions {
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
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

    &:disabled {
      cursor: default;
      opacity: 0.45;
    }
  }
}

.archives-danger-action {
  :deep(svg) {
    color: var(--danger-color);
  }
}

.archives-item-detail,
.archives-item-remark {
  margin-top: 6px;
  color: var(--comment-text-color);
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.archives-item-wrapper.is-dual-column {
  .sub-item-title-wrapper {
    align-items: flex-start;
    gap: 6px;
  }

  .archives-item-title {
    font-size: 15px;
  }

  .archives-item-detail {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
  }

  .dual-non-simple-line {
    min-height: 18px;
  }

  .archives-item-remark {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
  }
}
</style>
