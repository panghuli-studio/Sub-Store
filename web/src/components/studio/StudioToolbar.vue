<template>
  <section
    class="studio-toolbar"
    :class="{ 'studio-toolbar-narrow': isWideScreenNarrowModeActive }"
  >
    <div class="studio-search">
      <font-awesome-icon
        icon="fa-solid fa-magnifying-glass"
        aria-hidden="true"
      /><UiInput
        type="search"
        v-model="search.query"
        :placeholder="
          t('studio.search') +
          (locale === 'zh'
            ? t(
                {
                  '/subs': 'studio.groupSub',
                  '/files': 'studio.groupFile',
                  '/sync': 'studio.groupArtifact',
                  '/shares': 'studio.groupShare',
                  '/archives': 'tabBar.archive',
                }[activePath],
              )
            : '')
        "
        :aria-label="t('studio.search')"
        clearable
      />
      <UiButton
        v-if="activeFilter"
        class="studio-active-filter"
        v-tooltip="{ content: t('studio.clearFilter', { filter: activeFilter }) }"
        :aria-label="t('studio.clearFilter', { filter: activeFilter })"
        @click="studio.filters?.set('all')"
      >
        <span>{{ activeFilter }}</span>
        <font-awesome-icon icon="fa-solid fa-xmark" aria-hidden="true" />
      </UiButton>
    </div>
    <div class="studio-toolbar-actions">
      <UiIconButton
        :label="t('studio.manage')"
        icon="sliders"
        @activate="studio.managementOpen = true"
      /><UiIconButton
        v-if="activePath !== '/archives'"
        :label="t('studio.add')"
        icon="plus"
        @activate="add"
      /><UiIconButton
        v-if="showListViewToggle"
        :label="listViewModeToggleTitle"
        :icon="effectiveListViewMode === 'dual-column' ? 'table-list' : 'grip'"
        @activate="toggleListViewMode"
      />
    </div>
  </section>
  <nut-popup
    v-model:visible="studio.managementOpen"
    position="center"
    pop-class="studio-management studio-dialog"
    round
    closeable
    :lock-scroll="true"
    ><h2>{{ t("studio.manage") }}</h2>
    <p v-if="studio.description">{{ studio.description }}</p>
    <nut-radiogroup
      v-if="studio.filters"
      :model-value="studio.filters.value.value"
      @update:model-value="studio.filters.set($event)"
      ><nut-radio
        v-for="option in studio.filters.options.value"
        :key="option.value"
        :label="option.value"
        >{{ option.label || option.text }}</nut-radio
      ></nut-radiogroup
    >
    <div class="studio-management-bulk">
      <UiIconButton
        v-for="action in studio.pageActions"
        :key="action.label"
        :label="action.label"
        :icon="action.icon"
        @activate="action.run"
      /><template v-if="studio.selection"
        ><UiIconButton
          :label="t('studio.selectAll')"
          icon="check-double"
          @activate="studio.selection.all"
        /><UiIconButton
          v-if="studio.selection.expired"
          :label="t('studio.selectExpired')"
          icon="filter"
          @activate="studio.selection.expired"
        /><UiIconButton
          v-if="studio.selection.restore"
          :label="t('studio.restore')"
          icon="reply"
          :disabled="!studio.selection.count()"
          @activate="studio.selection.restore"
        /><UiIconButton
          :label="t('studio.delete')"
          icon="trash-can"
          danger
          :disabled="!studio.selection.count()"
          @activate="studio.selection.remove"
        /><span>{{ studio.selection.count() }}</span></template
      >
    </div>
    <article
      v-for="(resource, key) in studio.resources"
      :key="key"
      class="studio-management-item"
    >
      <nut-checkbox
        v-if="studio.selection && resource.data"
        :model-value="studio.selection.isSelected(resource.data)"
        @update:model-value="studio.selection.toggle(resource.data)"
        >{{ resource.name }}</nut-checkbox
      ><strong v-else>{{ resource.name }}</strong>
      <div
        v-for="control in resource.controls"
        :key="control.label"
        class="studio-management-control"
      >
        <span>{{ control.label }}</span
        ><nut-switch
          :model-value="control.get()"
          :disabled="control.disabled()"
          :aria-label="control.label"
          @update:model-value="control.set($event)"
        />
      </div>
      <div class="studio-card-actions">
        <UiIconButton
          v-for="action in resource.actions"
          :key="action.label"
          :label="action.label"
          :icon="action.icon"
          :danger="action.danger"
          @activate="action.run"
        />
      </div></article
  ></nut-popup>
</template>
<script setup lang="ts">
import { useWideScreenNarrowMode } from "@/hooks/useWideScreenNarrowMode";
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useListSearchStore } from "@/store/listSearch";
import { useMethodStore } from "@/store/methodStore";
import { useListViewMode } from "@/hooks/useListViewMode";
import { useStudioStore } from "@/store/studio";
const { isWideScreenNarrowModeActive } = useWideScreenNarrowMode();
const props = defineProps<{ pagePath?: string }>();
const route = useRoute();
const activePath = computed(() => props.pagePath || route.path);
const router = useRouter();
const { t, locale } = useI18n();
const search = useListSearchStore();
const methods = useMethodStore();
const studio = useStudioStore();
const activeFilter = computed(() => {
  const filters = studio.filters;
  if (!filters || filters.value.value === "all") return "";
  const option = filters.options.value.find(
    (option) => option.value === filters.value.value,
  );
  return option?.label || option?.text || "";
});
const { showListViewToggle, effectiveListViewMode, toggleListViewMode } =
  useListViewMode();
const listViewModeToggleTitle = computed(() =>
  t(
    effectiveListViewMode.value === "dual-column"
      ? "navBar.listView.switchToSingle"
      : "navBar.listView.switchToDual",
  ),
);
watch(
  () => route.path,
  () => {
    search.syncRoute(route.path, true);
    studio.clear();
  },
  { immediate: true },
);
function add() {
  if (route.path === "/shares") router.push("/edit/shares/UNTITLED");
  else
    methods.invokeMethod(
      { "/subs": "addSub", "/files": "addFile", "/sync": "addSync" }[
        route.path
      ],
      {},
    );
}
</script>
