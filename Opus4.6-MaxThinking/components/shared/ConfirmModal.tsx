"use client";

import {
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@carbon/react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirm",
  danger = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <ComposedModal open={open} onClose={onClose} size="sm">
      <ModalHeader title={title} />
      <ModalBody>
        <p>{description}</p>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button kind={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmText}
        </Button>
      </ModalFooter>
    </ComposedModal>
  );
}
