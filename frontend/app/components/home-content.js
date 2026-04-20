"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useProjectBoardState } from "../hooks/use-project-board-state";
import { buildInfo } from "./home-content-build-info";
import { HomeContentBoardFilters } from "./home-content-board-filters";
import { HomeContentBoardMessages } from "./home-content-board-messages";
import { HomeContentBoardViews } from "./home-content-board-views";
import { HomeContentHero } from "./home-content-hero";
import { HomeContentKpiPagination } from "./home-content-kpi-pagination";

/**
 * Tableau de bord projet : compose les sous-sections (en-tête, filtres, vues).
 * L’état métier reste dans `useProjectBoardState`.
 */
export default function HomeContent({ initialProjectId, view = "kanban" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const info = useMemo(() => buildInfo(searchParams), [searchParams]);

  const board = useProjectBoardState({
    initialProjectId,
    view,
    searchParams,
  });

  const {
    projects,
    isLoadingProjects,
    projectError,
    categoryLabels,
    categoryOrder,
    newCategoryLabel,
    setNewCategoryLabel,
    activeProjectId,
    setActiveProjectId,
    tasks,
    isLoadingTasks,
    taskError,
    actionInfo,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    movingTaskIds,
    calendarTasks,
    isLoadingCalendar,
    activeView,
    availableCategoryKeys,
    visibleTasks,
    groupedTasksByStatus,
    sortedVisibleTasks,
    groupedForListView,
    total,
    aFaire,
    enCours,
    terminees,
    truncationMessage,
    paginationUi,
    goToPreviousPage,
    goToNextPage,
    updateCategoryLabel,
    addCategory,
    resetCategoryLabels,
    handleDeleteTask,
    handleMoveTask,
    resetBoardFilters,
    filtersHideAllTasks,
    activeProjectName,
    calendarFilteredTasks,
    tacheGuide,
  } = board;

  return (
    <main className="travel-shell">
      <section
        className="hero-block compact"
        aria-labelledby="board-project-title"
      >
        <HomeContentHero
          router={router}
          activeProjectName={activeProjectName}
          activeView={activeView}
          activeProjectId={activeProjectId}
          projects={projects}
          setActiveProjectId={setActiveProjectId}
        />

        <HomeContentBoardFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          availableCategoryKeys={availableCategoryKeys}
          categoryLabels={categoryLabels}
          sortBy={sortBy}
          setSortBy={setSortBy}
          activeView={activeView}
        />
      </section>

      <HomeContentBoardMessages
        actionInfo={actionInfo}
        info={info}
        isLoadingProjects={isLoadingProjects}
        projectError={projectError}
        isLoadingTasks={isLoadingTasks}
        taskError={taskError}
        filtersHideAllTasks={filtersHideAllTasks}
        resetBoardFilters={resetBoardFilters}
        truncationMessage={truncationMessage}
      />

      <HomeContentKpiPagination
        total={total}
        aFaire={aFaire}
        enCours={enCours}
        terminees={terminees}
        paginationUi={paginationUi}
        goToPreviousPage={goToPreviousPage}
        goToNextPage={goToNextPage}
        activeView={activeView}
      />

      <HomeContentBoardViews
        activeView={activeView}
        activeProjectId={activeProjectId}
        groupedTasksByStatus={groupedTasksByStatus}
        tasks={tasks}
        sortBy={sortBy}
        handleDeleteTask={handleDeleteTask}
        handleMoveTask={handleMoveTask}
        movingTaskIds={movingTaskIds}
        sortedVisibleTasks={sortedVisibleTasks}
        visibleTasks={visibleTasks}
        isLoadingCalendar={isLoadingCalendar}
        calendarTasks={calendarTasks}
        calendarFilteredTasks={calendarFilteredTasks}
        groupedForListView={groupedForListView}
        categoryOrder={categoryOrder}
        categoryLabels={categoryLabels}
        updateCategoryLabel={updateCategoryLabel}
        resetCategoryLabels={resetCategoryLabels}
        newCategoryLabel={newCategoryLabel}
        setNewCategoryLabel={setNewCategoryLabel}
        addCategory={addCategory}
        tacheGuide={tacheGuide}
      />
    </main>
  );
}
