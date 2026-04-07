export type WidgetAction =
  | {
  type: 'routine_slot_taken';
  slotId: string;
  createdAt: string;
}
  | {
  type: 'as_needed_taken';
  medicationId: string;
  createdAt: string;
};
