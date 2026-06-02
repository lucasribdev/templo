import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/categorias")({
	component: CategoriesLayout,
});

function CategoriesLayout() {
	return <Outlet />;
}
