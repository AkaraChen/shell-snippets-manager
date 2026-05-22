import { useMutation } from "@tanstack/react-query";
import { syncApi } from "@/api/snippets";

export function useSyncToShell() {
	return useMutation({
		mutationFn: (shellType: string) => syncApi.syncToFile(shellType),
	});
}

export function useSyncAllShells() {
	return useMutation({
		mutationFn: () => syncApi.syncAllShells(),
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
