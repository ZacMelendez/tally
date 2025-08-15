import React from "react";
import { AlertTriangle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./dialog";
import { Button } from "./button";

interface ConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    loading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    destructive = false,
    loading = false,
}) => {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        {destructive && (
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                            </div>
                        )}
                        <div className="flex-1">
                            <DialogTitle>{title}</DialogTitle>
                        </div>
                    </div>
                    <DialogDescription className="text-left">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={destructive ? "destructive" : "default"}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading && (
                            <div className="loading-spinner w-4 h-4 mr-2" />
                        )}
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
