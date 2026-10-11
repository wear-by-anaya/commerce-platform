export type ConnectionStatus = "NOT_CONNECTED";

export interface OpsMetricCard {
  label: string;
  value: string;
  status: ConnectionStatus;
}
