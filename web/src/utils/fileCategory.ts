export type FileCategory = "config" | "nodes" | "other";
export function getFileCategory(file: any): FileCategory {
  if (["config", "nodes", "other"].includes(file.uiCategory))
    return file.uiCategory;
  if (file.type === "mihomoConfig") return "config";
  const name = String(file.displayName || file.name || "");
  if (/configuration|完整配置|配置文件/i.test(name)) return "config";
  if (/nodes|节点/i.test(name)) return "nodes";
  if (/(?:^|\n)(?:proxy-groups|rules|dns):/.test(file.content || ""))
    return "config";
  if (/^(?:proxies:|ss:|ssr:|vmess:|vless:|trojan:)/.test(file.content || ""))
    return "nodes";
  return "other";
}
