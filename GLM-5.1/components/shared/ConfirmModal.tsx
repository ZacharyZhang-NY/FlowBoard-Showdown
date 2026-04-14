"use client";

import { Modal } from "@carbon/react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  primaryButtonText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  primaryButtonText = "Confirm",
  danger,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      modalHeading={title}
      primaryButtonText={primaryButtonText}
      secondaryButtonText="Cancel"
      danger={danger}
      onRequestSubmit={onConfirm}
      onRequestClose={onCancel}
      onSecondarySubmit={onCancel}
    >
      <p>{message}</p>
    </Modal>
  );
}
