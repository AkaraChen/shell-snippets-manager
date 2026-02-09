import { Suspense } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { Aliases } from "@/pages/Aliases";
import { Create } from "@/pages/Create";
import { Home } from "@/pages/Home";

function App() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-background" />}>
			<Switch>
				<Route path="/" component={Home} />
				<Route path="/aliases" component={Aliases} />
				<Route path="/create" component={Create} />
			</Switch>
			<Toaster position="bottom-right" />
		</Suspense>
	);
}

export default App;
