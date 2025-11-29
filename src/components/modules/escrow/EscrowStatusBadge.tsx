import { Badge } from "@/components/ui/badge";
import { EscrowState, EscrowStates } from "@/lib/escrow-state-machine";
import { cn } from "@/lib/utils";

interface EscrowStatusBadgeProps {
    status: EscrowState;
    className?: string;
}

export function EscrowStatusBadge({ status, className }: EscrowStatusBadgeProps) {
    const getStatusConfig = (status: EscrowState) => {
        switch (status) {
            case EscrowStates.HELD:
                return {
                    label: "Payment Held",
                    variant: "warning", // We might need to map this to standard badge variants or custom classes
                    className: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
                };
            case EscrowStates.RELEASED:
                return {
                    label: "Payment Released",
                    variant: "success",
                    className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
                };
            case EscrowStates.DISPUTED:
                return {
                    label: "Under Review",
                    variant: "destructive",
                    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
                };
            case EscrowStates.REFUNDED:
                return {
                    label: "Refunded",
                    variant: "secondary",
                    className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
                };
            default:
                return {
                    label: status,
                    variant: "outline",
                    className: "",
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <Badge
            variant="outline"
            className={cn("font-semibold uppercase tracking-wider", config.className, className)}
        >
            {config.label}
        </Badge>
    );
}
