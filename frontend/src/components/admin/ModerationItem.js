import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  Delete,
  PushPin,
  Flag,
  Person,
  Schedule
} from '@mui/icons-material';

const ModerationItem = ({
  item,
  onApprove,
  onReject,
  onDelete,
  onPin,
  getTypeIcon,
  getTypeColor
}) => {
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return 'No content available';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1} flex={1}>
            {getTypeIcon(item.type)}
            <Typography variant="h6" component="div" sx={{ flex: 1 }}>
              {item.title}
            </Typography>
            <Chip
              icon={getTypeIcon(item.type)}
              label={item.type.replace('_', ' ')}
              size="small"
              color={getTypeColor(item.type)}
              variant="outlined"
            />
            {item.isFlagged && (
              <Chip
                icon={<Flag />}
                label="Flagged"
                size="small"
                color="error"
              />
            )}
            {item.reports > 0 && (
              <Chip
                label={`${item.reports} reports`}
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={0.5}>
            <Tooltip title={formatTimeAgo(item.createdAt)}>
              <Chip
                icon={<Schedule />}
                label={formatTimeAgo(item.createdAt)}
                size="small"
                variant="outlined"
              />
            </Tooltip>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {truncateContent(item.content)}
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Person fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {item.user?.name || 'Unknown User'}
              </Typography>
            </Box>
            {item.user?.email && (
              <Typography variant="caption" color="text.secondary">
                ({item.user.email})
              </Typography>
            )}
          </Box>

          <Box display="flex" gap={1}>
            {onPin && (
              <Tooltip title="Pin this post">
                <IconButton
                  size="small"
                  onClick={onPin}
                  color="primary"
                >
                  <PushPin />
                </IconButton>
              </Tooltip>
            )}

            <Button
              startIcon={<ThumbUp />}
              onClick={onApprove}
              variant="contained"
              color="success"
              size="small"
            >
              Approve
            </Button>

            <Button
              startIcon={<ThumbDown />}
              onClick={onReject}
              variant="outlined"
              color="warning"
              size="small"
            >
              Reject
            </Button>

            <Button
              startIcon={<Delete />}
              onClick={onDelete}
              variant="outlined"
              color="error"
              size="small"
            >
              Delete
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ModerationItem;