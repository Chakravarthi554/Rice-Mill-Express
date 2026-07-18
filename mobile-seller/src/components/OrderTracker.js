import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar, Colors } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { connectSocket, subscribeToOrderUpdates, joinRoom, leaveRoom } from '../services/socket';

const statusSteps = [
  { label: 'Placed', value: 'placed', icon: 'shopping-cart' },
  { label: 'Packed', value: 'packed', icon: 'package' },
  { label: 'Shipped', value: 'shipped', icon: 'local-shipping' },
  { label: 'Out for Delivery', value: 'out_for_delivery', icon: 'delivery-dining' },
  { label: 'Delivered', value: 'delivered', icon: 'check-circle' }
];

const OrderTracker = ({ order, userId }) => {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [activeStep, setActiveStep] = useState(0);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    updateActiveStep(currentOrder.orderStatus);

    const setupSocket = async () => {
      // Use the global socket.io service instead of the raw WebSocket implementation
      await connectSocket();
      subscribeToOrderUpdates((updatedOrder) => {
        if (updatedOrder._id === order._id) {
          setCurrentOrder(updatedOrder);
          updateActiveStep(updatedOrder.orderStatus);
        }
      });
      joinRoom(`order_${order._id}`);
    };

    setupSocket();

    return () => {
      leaveRoom(`order_${order._id}`);
      // Don't disconnect globally as other screens might need it
    };
  }, []);

  const updateActiveStep = (status) => {
    if (status === 'cancelled') {
      setActiveStep(-1);
    } else if (status === 'returned') {
      setActiveStep(-2);
    } else {
      const stepIndex = statusSteps.findIndex(step => step.value === status);
      setActiveStep(stepIndex >= 0 ? stepIndex : 0);
    }
  };

  const calculateProgress = () => {
    if (activeStep < 0) return 1;
    return (activeStep + 1) / statusSteps.length;
  };

  const getStatusColor = () => {
    if (activeStep < 0) return Colors.red500;
    return Colors.green500;
  };

  return (
    <View style={styles.container}>
      <ProgressBar
        progress={calculateProgress()}
        color={getStatusColor()}
        style={styles.progressBar}
      />

      {activeStep === -1 ? (
        <View style={styles.statusContainer}>
          <MaterialIcons name="cancel" size={24} color={Colors.red500} />
          <Text style={[styles.statusText, { color: Colors.red500 }]}>
            Order Cancelled
          </Text>
        </View>
      ) : activeStep === -2 ? (
        <View style={styles.statusContainer}>
          <MaterialIcons name="assignment-return" size={24} color={Colors.red500} />
          <Text style={[styles.statusText, { color: Colors.red500 }]}>
            Order Returned
          </Text>
        </View>
      ) : (
        <View style={styles.stepsContainer}>
          {statusSteps.map((step, index) => (
            <View
              key={step.value}
              style={[
                styles.step,
                index <= activeStep && styles.activeStep
              ]}
            >
              <Icon
                name={step.icon}
                size={20}
                color={index <= activeStep ? Colors.green500 : Colors.grey500}
              />
              <Text
                style={[
                  styles.stepText,
                  index <= activeStep && styles.activeStepText
                ]}
              >
                {step.label}
              </Text>
              {index < statusSteps.length - 1 && (
                <View style={styles.stepConnector} />
              )}
            </View>
          ))}
        </View>
      )}

      <Text style={styles.updateText}>
        Last updated: {new Date(currentOrder.updatedAt).toLocaleString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  step: {
    alignItems: 'center',
    flex: 1,
  },
  activeStep: {
    // Additional active styles if needed
  },
  stepText: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.grey500,
    textAlign: 'center',
  },
  activeStepText: {
    color: Colors.green500,
    fontWeight: 'bold',
  },
  stepConnector: {
    position: 'absolute',
    top: 10,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: Colors.grey300,
    zIndex: -1,
  },
  updateText: {
    fontSize: 12,
    color: Colors.grey600,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default OrderTracker;