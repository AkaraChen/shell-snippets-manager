import { Suspense } from "react";
import { Route, Switch } from "wouter";
import { NativeAppShell } from "@/components/NativeAppShell";
import { Create } from "@/pages/Create";

function App() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-background" />}>
			<Switch>
				<Route path="/create" component={Create} />
				<Route component={NativeAppShell} />
			</Switch>
		</Suspense>
	);
}

export default App;
