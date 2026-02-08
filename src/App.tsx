import { Suspense } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { Home } from "@/pages/Home";

function App() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-background" />}>
			<Switch>
				<Route path="/" component={Home} />
			</Switch>
			<Toaster position="bottom-right" />
		</Suspense>
	);
}

export default App;
