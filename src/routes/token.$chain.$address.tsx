// VYRA Token Deep Dive — Detailed token analysis page
import { createFileRoute } from "@tanstack/react-router";
import TokenDetail from "../../pages/TokenDetail";

export const Route = createFileRoute("/token/$chain/$address")({
  component: TokenDetail,
});
