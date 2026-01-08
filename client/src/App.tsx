import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import VideoDetail from "./pages/VideoDetail";
import YouTubeCallback from "./pages/YouTubeCallback";
import SyncSettings from "./pages/SyncSettings";
import Audience from "./pages/Audience";
import InstructionScripts from "./pages/InstructionScripts";
import LegalNotice from "./pages/LegalNotice";
import TestsActifs from "./pages/TestsActifs";
import TestsTermines from "./pages/TestsTermines";
import ModelComparison from "./pages/ModelComparison";
import FavoritePrompts from "./pages/FavoritePrompts";
import Brainstorm from "./pages/Brainstorm";
import Competition from "./pages/Competition";
import SavedIdeas from "./pages/SavedIdeas";
import TrendsExplorer from "./pages/TrendsExplorer";
import ScriptStudio from "./pages/ScriptStudio";
import Settings from "./pages/Settings";
import VideoTemplates from "./pages/VideoTemplates";
import ViewTrends from "./pages/ViewTrends";
import ApiKeys from "./pages/ApiKeys";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/video/:id"} component={VideoDetail} />
      <Route path={"/audience/:id"} component={Audience} />
      <Route path={"/youtube/callback"} component={YouTubeCallback} />
      <Route path={"/sync-settings"} component={SyncSettings} />
      <Route path={"/instruction-scripts"} component={InstructionScripts} />
      <Route path={"/legal"} component={LegalNotice} />
      <Route path={"/tests-actifs"} component={TestsActifs} />
      <Route path={"/tests-termines"} component={TestsTermines} />
      <Route path={"/model-comparison"} component={ModelComparison} />
      <Route path={"/favorite-prompts"} component={FavoritePrompts} />
      <Route path={"/brainstorm"} component={Brainstorm} />
      <Route path={"/competition"} component={Competition} />
      <Route path={"/saved-ideas"} component={SavedIdeas} />
      <Route path={"/trends"} component={TrendsExplorer} />
      <Route path="/script-writing" component={ScriptStudio} />
      <Route path="/settings" component={Settings} />
      <Route path="/video-templates" component={VideoTemplates} />
      <Route path="/view-trends" component={ViewTrends} />
      <Route path="/api-keys" component={ApiKeys} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
