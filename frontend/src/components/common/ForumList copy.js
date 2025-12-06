import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Select, MenuItem } from '@mui/material';
import { getPosts } from '../../redux/actions/forumActions';

const ForumList = () => {
  const dispatch = useDispatch();
  const { posts = [], loading = false } = useSelector((state) => state.forumPostList || { posts: [], loading: false });
  const [category, setCategory] = React.useState('');

  useEffect(() => {
    dispatch(getPosts({ category, status: 'approved' }));
  }, [dispatch, category]);

  return (
    <Box className="p-4">
      <Typography variant="h4" className="mb-4">Community Forum</Typography>
      <div className="mb-4 flex justify-between">
        <Button component={Link} to="/forum/create" className="mb-4 bg-blue-500 text-white hover:bg-blue-700">Create Post</Button>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} displayEmpty className="ml-4">
          <MenuItem value="">All Categories</MenuItem>
          <MenuItem value="Tips">Tips</MenuItem>
          <MenuItem value="Storage">Storage</MenuItem>
          <MenuItem value="Festivals">Festivals</MenuItem>
          <MenuItem value="Messages">Messages</MenuItem>
        </Select>
      </div>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : posts.length === 0 ? (
        <Typography>No posts available.</Typography>
      ) : (
        <Box className="space-y-4">
          {posts.map((post) => (
            <Card key={post._id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent>
                <Typography variant="h6" className="font-bold">{post.title}</Typography>
                <Typography>Posted by: {post.userId?.name || 'Unknown'}</Typography>
                <Typography>Category: {post.category}</Typography>
                <Typography>Tags: {post.tags?.join(', ') || 'N/A'}</Typography>
                <Typography>Likes: {post.likes?.length || 0}</Typography>
                <Button component={Link} to={`/forum/${post._id}`} className="mt-2 bg-blue-500 text-white hover:bg-blue-700">View Post</Button>
                {post.linkedRecipe && (
                  <Button component={Link} to={`/recipes/${post.linkedRecipe._id}`} className="ml-2 mt-2 bg-green-500 text-white hover:bg-green-700">
                    View Linked Recipe
                  </Button>
                )}
                {post.linkedProduct && (
                  <Button component={Link} to={`/product/${post.linkedProduct._id}`} className="ml-2 mt-2 bg-purple-500 text-white hover:bg-purple-700">
                    View Linked Product
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ForumList;