import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { syncApi } from "@/api/snippets";

export function useSyncToShell() {
	return useMutation({
		mutationFn: (shellType: string) => syncApi.syncToFile(shellType),
		onSuccess: (path: string, shellType: string) => {
			toast.success(`Synced to ${shellType}`, {
				description: path,
			});
		},
		onError: (error: Error) => {
			toast.error("Sync failed", {
				description: error.message,
			});
		},
	});
}

export function useSyncAllShells() {
	return useMutation({
		mutationFn: () => syncApi.syncAllShells(),
		onSuccess: (paths: string[]) => {
			toast.success("Synced all shells", {
				description: `${paths.length} file${paths.length !== 1 ? "s" : ""} updated`,
			});
		},
		onError: (error: Error) => {
			toast.error("Sync failed", {
				description: error.message,
			});
		},
	});
}

export function useGetSourceLine() {
	return useMutation({
		mutationFn: (shellType: string) => syncApi.getSourceLine(shellType),
	});
}

export function useGetOutputDirectory() {
	return useMutation({
		mutationFn: () => syncApi.getOutputDirectory(),
	});
}
