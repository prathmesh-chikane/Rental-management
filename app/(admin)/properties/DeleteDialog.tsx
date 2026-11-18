
"use client";

import { Loader2, Trash2, AlertTriangle, X } from "lucide-react";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";

type Props = {
    propertyName: string;
    busy: boolean;
    error: string;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function DeleteDialog({
    propertyName,
    busy,
    error,
    onConfirm,
    onCancel,
}: Props) {
    return (
        <AlertDialog
            open
            onOpenChange={(open) => {
                if (!open && !busy) onCancel();
            }}
        >
            <AlertDialogContent className="max-w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl">

                {/* Header */}
                <div className="relative border-b border-slate-100 px-6 pb-5 pt-6">

                    <div className="flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-100">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>

                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={busy}
                            aria-label="Close dialog"
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <AlertDialogHeader className="mt-5 text-left">
                        <AlertDialogTitle className="text-xl font-bold tracking-tight text-slate-950">
                            Delete Property?
                        </AlertDialogTitle>

                        <AlertDialogDescription className="mt-2 text-sm leading-6 text-slate-500">
                            Are you sure you want to delete{" "}
                            <span className="font-bold text-slate-800">
                                "{propertyName}"
                            </span>
                            ? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                {/* Footer */}
                <AlertDialogFooter className="flex flex-row justify-end gap-2 px-6 pb-6 pt-5">

                    <AlertDialogCancel
                        disabled={busy}
                        className="mt-0 h-10 rounded-xl border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </AlertDialogCancel>

                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={busy}
                        className="h-10 min-w-[120px] gap-2 rounded-xl bg-red-500 px-5 text-sm font-bold shadow-sm transition-all hover:bg-red-400"
                    >
                        {busy ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4" />
                                Delete Property
                            </>
                        )}
                    </Button>

                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
