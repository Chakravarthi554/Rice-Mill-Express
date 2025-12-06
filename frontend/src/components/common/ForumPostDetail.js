import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Button, TextField } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { getPostById, replyToPost, likePost } from '../../redux/actions/forumActions';
import ChatWindow from './ChatWindow';

const ForumPostDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { post, loading } = useSelector((state) => state.forum);
  const { userInfo } = useSelector((state) => state.userLogin);
  const [reply, setReply] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    dispatch(getPostById(id));
  }, [dispatch, id]);

  const handleReply = () => {
    if (reply.trim()) {
      dispatch(replyToPost(id, reply));
      setReply('');
    }
  };

  const handleLike = () => {
    dispatch(likePost(id));
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (!post) return <Typography>Post not found</Typography>;

  return (
    <Box className="p-4">
      <Typography variant="h4">{post.title}</Typography>
      <Typography>Posted by: {post.userId.name}</Typography>
      <Typography>Category: {post.category}</Typography>
      <Typography>Tags: {post.tags.join(', ')}</Typography>
      <Typography className="my-4">{post.content}</Typography>
      <Box className="my-4">
        <Button onClick={handleLike} startIcon={<ThumbUpIcon />}>
          Like ({post.likes.length})
        </Button>
        {post.linkedRecipe && (
          <Button component={Link} to={`/recipes/${post.linkedRecipe._id}`} className="ml-2">
            View Linked Recipe
          </Button>
        )}
        {post.linkedProduct && (
          <Button component={Link} to={`/product/${post.linkedProduct._id}`} className="ml-2">
            View Linked Product
          </Button>
        )}
        <Button onClick={() => setChatOpen(true)} className="ml-2">Chat Poster</Button>
      </Box>
      <Box className="my-4">
        <Typography variant="h6">Replies</Typography>
        <TextField
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Add a reply"
          fullWidth
          multiline
          rows={3}
          className="mb-2"
        />
        <Button onClick={handleReply} disabled={!reply.trim() || !userInfo}>Submit Reply</Button>
        {post.replies.map((r, idx) => (
          <Box key={idx} className="mt-2 pl-4 border-l-2">
            <Typography>{r.userId.name}: {r.content}</Typography>
          </Box>
        ))}
      </Box>
      {chatOpen && (
        <ChatWindow
          receiverId={post.userId._id}
          productId={post.linkedProduct?._id}
          onClose={() => setChatOpen(false)}
        />
      )}
    </Box>
  );
};

export default ForumPostDetail;