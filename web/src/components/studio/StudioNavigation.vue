<template>
  <aside
    class="studio-sidebar"
    :class="{ 'studio-sidebar-hidden': isWideScreenNarrowModeActive }"
  >
    <router-link class="studio-brand" to="/subs"
      ><span class="studio-brand-mark">S</span
      ><span>Sub-Store</span></router-link
    >
    <nav aria-label="Sub-Store">
      <router-link
        v-for="item in navigation"
        :key="item.path"
        :to="item.path"
        class="studio-nav-link"
        :class="{ active: route.path === item.path }"
        :aria-label="t(item.label)"
        ><font-awesome-icon
          :icon="'fa-solid fa-' + item.icon"
          aria-hidden="true"
        /><span>{{ t(item.label) }}</span></router-link
      >
    </nav>
    <small class="studio-version"
      >{{ t("studio.version") }} {{ version }}</small
    >
  </aside>
  <nav
    class="studio-mobile-nav"
    :class="{ 'studio-mobile-wide': isWideScreenNarrowModeActive }"
    aria-label="Sub-Store"
  >
    <router-link
      v-for="item in navigation"
      :key="item.path"
      :to="item.path"
      :class="{ active: route.path === item.path }"
      ><font-awesome-icon
        :icon="'fa-solid fa-' + item.icon"
        aria-hidden="true"
      /><span>{{ t(item.label) }}</span></router-link
    >
  </nav>
</template>
<script setup lang="ts">
import { version } from "../../../package.json";
import { useWideScreenNarrowMode } from "@/hooks/useWideScreenNarrowMode";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "@/store/settings";
import { useGlobalStore } from "@/store/global";
const { isWideScreenNarrowModeActive } = useWideScreenNarrowMode();
const route = useRoute();
const { t } = useI18n();
const settings = useSettingsStore();
const global = useGlobalStore();
const navigation = computed(() =>
  [
    { path: "/subs", label: "tabBar.sub", icon: "link" },
    {
      path: "/files",
      label: "tabBar.file",
      icon: "layer-group",
      hidden: settings.appearanceSetting.istabBar2,
    },
    {
      path: "/sync",
      label: "tabBar.sync",
      icon: "arrows-rotate",
      hidden: settings.appearanceSetting.istabBar,
    },
    {
      path: "/shares",
      label: "tabBar.share",
      icon: "share-nodes",
      hidden:
        settings.appearanceSetting.istabBar3 ||
        global.env.feature?.share === false,
    },
    {
      path: "/archives",
      label: "tabBar.archive",
      icon: "box-archive",
      hidden: global.env.feature?.archive === false,
    },
    { path: "/my", label: "studio.settings", icon: "gear" },
  ].filter((item) => !item.hidden),
);
</script>
