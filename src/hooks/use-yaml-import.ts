"use client";

import { useCallback, useRef } from "react";
import { usePipelineStore } from "@/stores/pipeline-store";
import { parseYaml } from "@/lib/yaml/parser";

export function useYamlImport() {
  const setNodes = usePipelineStore((s) => s.setNodes);
  const setEdges = usePipelineStore((s) => s.setEdges);
  const setName = usePipelineStore((s) => s.setName);
  const setMetadata = usePipelineStore((s) => s.setMetadata);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const importFromString = useCallback(
    (yamlString: string, fileName?: string) => {
      try {
        const { nodes, edges, metadata } = parseYaml(yamlString);
        setNodes(nodes);
        setEdges(edges);
        if (metadata) {
          if (metadata.name) {
            setName(metadata.name);
          } else if (fileName) {
            setName(fileName.replace(/\.(yaml|yml)$/, ""));
          }
          setMetadata({
            namespace: metadata.namespace,
            version: metadata.version,
            description: metadata.description,
            owner: metadata.owner,
            tags: metadata.tags,
            meta: metadata.meta,
            schedule: metadata.schedule,
          });
        } else if (fileName) {
          setName(fileName.replace(/\.(yaml|yml)$/, ""));
        }
      } catch (error) {
        console.error("Failed to parse YAML:", error);
        alert("Failed to parse YAML file. Check the console for details.");
      }
    },
    [setNodes, setEdges, setName, setMetadata],
  );

  const importFromFile = useCallback(() => {
    if (!fileInputRef.current) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".yaml,.yml";
      input.style.display = "none";
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    const input = fileInputRef.current;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        importFromString(reader.result as string, file.name);
      };
      reader.readAsText(file);
      input.value = "";
    };
    input.click();
  }, [importFromString]);

  return { importFromFile, importFromString };
}
