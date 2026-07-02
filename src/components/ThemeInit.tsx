import { THEME_INIT_SCRIPT } from "@/lib/theme";

export default function ThemeInit() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  );
}
