<template>
  <div class="app-layout-wrapper">
    <router-view v-slot="{ Component }"
      ><div
        v-if="isDetail"
        class="studio-detail-background"
        aria-hidden="true"
        inert
      >
        <StudioToolbar
          v-if="backgroundKey !== 'settings'"
          :page-path="'/' + backgroundKey"
        /><component :is="backgroundPages[backgroundKey]" />
      </div>
      <nut-popup
        v-if="isDetail"
        :visible="true"
        position="center"
        :pop-class="
          'studio-route-dialog studio-dialog' +
          (route.path.startsWith('/settings/') ? ' studio-settings-route' : '')
        "
        :lock-scroll="true"
        role="dialog"
        :aria-label="title"
        @update:visible="(value) => !value && closeDetail()"
        ><div class="studio-detail-heading">
          <h2>{{ title }}</h2>
          <UiIconButton
            :label="t('studio.close')"
            icon="xmark"
            @activate="closeDetail"
          />
        </div>
        <component :is="Component" /></nut-popup
      ><component v-else :is="Component"
    /></router-view>
  </div>
</template>

<script lang="ts" setup>
import StudioToolbar from "@/components/studio/StudioToolbar.vue";
import { defineAsyncComponent } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import TabBar from "@/components/TabBar.vue";
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useWideScreenNarrowMode } from "@/hooks/useWideScreenNarrowMode";
import { useGlobalStore } from "@/store/global";

const globalStore = useGlobalStore();
const { bottomSafeArea } = storeToRefs(globalStore);
const { shouldShowTabBar } = useWideScreenNarrowMode();

const height = computed(() => {
  if (shouldShowTabBar.value) {
    return 44 + 12 + bottomSafeArea.value + "px";
  } else {
    return "16px";
  }
});

const backgroundPages = {
  subs: defineAsyncComponent(() => import("@/views/Sub.vue")),
  files: defineAsyncComponent(() => import("@/views/File.vue")),
  sync: defineAsyncComponent(() => import("@/views/Sync.vue")),
  shares: defineAsyncComponent(() => import("@/views/share/Share.vue")),
  settings: defineAsyncComponent(() => import("@/views/My.vue")),
};
const backgroundKey = computed(() =>
  route.path.startsWith("/edit/files")
    ? "files"
    : route.path.startsWith("/edit/sync")
      ? "sync"
      : route.path.startsWith("/edit/shares")
        ? "shares"
        : route.path.startsWith("/edit/")
          ? "subs"
          : "settings",
);
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const isDetail = computed(
  () =>
    /^\/(edit|settings)\//.test(route.path) ||
    ["/aboutUs", "/logs", "/preview"].includes(route.path),
);
const title = computed(() =>
  t("navBar.pagesTitle." + String(route.meta.title)),
);
function closeDetail() {
  router.push(
    route.path.startsWith("/edit/files")
      ? "/files"
      : route.path.startsWith("/edit/sync")
        ? "/sync"
        : route.path.startsWith("/edit/shares")
          ? "/shares"
          : route.path.startsWith("/edit/")
            ? "/subs"
            : "/my",
  );
}
</script>

<style scoped lang="scss">
.app-layout-wrapper {
  flex: 1;
  padding: 56px 0 v-bind(height) 0;
  overflow: auto;
}
</style>
