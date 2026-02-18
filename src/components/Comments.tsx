import Giscus, { type Theme } from "@giscus/react";
import { getGiscusConfig } from "@/constants";
import { useEffect, useState } from "react";

interface CommentsProps {
  lightTheme?: Theme;
  darkTheme?: Theme;
}

export default function Comments({
  lightTheme = "light",
  darkTheme = "dark",
}: CommentsProps) {
  const [theme, setTheme] = useState<string>(() => {
    const currentTheme = localStorage.getItem("theme");
    if (currentTheme) return currentTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = ({ matches }: MediaQueryListEvent) => {
      setTheme(matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const currentTheme = root.getAttribute("data-theme");
      if (currentTheme) setTheme(currentTheme);
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mt-8">
      <Giscus
        theme={theme === "dark" ? darkTheme : lightTheme}
        {...getGiscusConfig()}
      />
    </div>
  );
}
