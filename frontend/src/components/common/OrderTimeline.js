import React from 'react';
import {
    Box,
    Typography,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Paper,
    Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
    Assignment as PlacedIcon,
    Cached as ProcessingIcon,
    Inventory2 as PackedIcon,
    LocalShipping as ShippedIcon,
    DeliveryDining as OutForDeliveryIcon,
    CheckCircle as DeliveredIcon,
    Cancel as CancelledIcon
} from '@mui/icons-material';

const statusIcons = {
    placed: <PlacedIcon />,
    processing: <ProcessingIcon />,
    packed: <PackedIcon />,
    shipped: <ShippedIcon />,
    out_for_delivery: <OutForDeliveryIcon />,
    delivered: <DeliveredIcon />,
    cancelled: <CancelledIcon />,
};

const statusColors = {
    placed: 'default',
    processing: 'info',
    packed: 'warning',
    shipped: 'primary',
    out_for_delivery: 'secondary',
    delivered: 'success',
    cancelled: 'error',
};

const OrderTimeline = ({ history = [], currentStatus }) => {
    const { t } = useTranslation();
    // Map statuses to steps
    const steps = [
        { label: t('placed') || 'Order Placed', statusKey: 'placed' },
        { label: t('processing') || 'Processing', statusKey: 'processing' },
        { label: t('packed') || 'Packed', statusKey: 'packed' },
        { label: t('shipped') || 'Shipped', statusKey: 'shipped' },
        { label: t('outForDelivery') || 'Out for Delivery', statusKey: 'out_for_delivery' },
        { label: t('delivered') || 'Delivered', statusKey: 'delivered' },
    ];

    // If cancelled, replace the current step or add it? 
    // Custom logic for cancelled:
    const isCancelled = currentStatus === 'cancelled';
    const displaySteps = isCancelled
        ? [...steps.filter(s => {
            // Find the last record in history before cancellation
            const lastNonCancel = history.findLast(h => h.status !== 'cancelled');
            // If we found it, keep steps up to that one
            // This is a bit complex, let's keep it simple: 
            // Show steps until the current index, then add cancelled.
            return true;
        }), { label: t('cancelled') || 'Cancelled', statusKey: 'cancelled' }]
        : steps;

    // Find the index of current status
    let activeStep = steps.findIndex(s => s.statusKey === currentStatus);
    if (isCancelled) activeStep = displaySteps.length - 1;

    return (
        <Box sx={{ maxWidth: 400, py: 2 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
                {displaySteps.map((step, index) => {
                    const historyItem = [...history].reverse().find(h => h.status === step.statusKey);
                    const isCompleted = index <= activeStep && !isCancelled;
                    const isActuallyCancelled = isCancelled && step.statusKey === 'cancelled';

                    return (
                        <Step key={step.statusKey} completed={isCompleted || isActuallyCancelled}>
                            <StepLabel
                                StepIconComponent={() => (
                                    <Box
                                        sx={{
                                            color: isCompleted || isActuallyCancelled ? 'primary.main' : 'text.disabled',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 24,
                                            height: 24
                                        }}
                                    >
                                        {statusIcons[step.statusKey]}
                                    </Box>
                                )}
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: isCompleted ? 'bold' : 'normal' }}>
                                    {step.label}
                                </Typography>
                                {historyItem && (
                                    <Typography variant="caption" color="text.secondary">
                                        {format(new Date(historyItem.timestamp), 'PPpp')}
                                    </Typography>
                                )}
                            </StepLabel>
                            <StepContent>
                                {historyItem?.notes && (
                                    <Paper variant="outlined" sx={{ p: 1, mt: 1, bgcolor: 'grey.50' }}>
                                        <Typography variant="body2">{historyItem.notes}</Typography>
                                    </Paper>
                                )}
                                {step.statusKey === 'out_for_delivery' && historyItem?.otp && (
                                    <Chip
                                        label={`OTP: ${historyItem.otp}`}
                                        size="small"
                                        color="secondary"
                                        sx={{ mt: 1 }}
                                    />
                                )}
                            </StepContent>
                        </Step>
                    );
                })}
            </Stepper>
        </Box>
    );
};

export default OrderTimeline;
