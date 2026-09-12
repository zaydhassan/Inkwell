import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Typography, InputAdornment, TextField, Box, Grid, Button, CircularProgress, Stack, Chip
} from '@mui/material';
import BlogCard from '../components/BlogCard';
import BlogGrid from '../components/BlogGrid';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import SkeletonBlogCard from '../components/SkeletonBlogCard';
import UserAvatar from '../components/UserAvatar';
import SectionHeading from '../components/SectionHeading';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { onActivate } from '../utils/a11y';

const PAGE_SIZE = 9;

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState(false);
  // Real trending posts (top 5 by likes/comments/views from the server).
  // Falls back to the head of the regular feed if the endpoint fails.
  const [trending, setTrending] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const categories = ['Technology', 'Education', 'Health', 'Entertainment', 'Food', 'Business', 'Social Media', 'Travel', 'News'];

  // The search box is debounced and sent to the server (?q=), so search covers
  // the whole catalog, not just the currently loaded page. Previously the
  // client fetched every blog up front and filtered in memory — that doesn't
  // scale and breaks once the list is paginated.
  const debounceRef = useRef(null);

  const isCategoryPage = location.pathname.startsWith('/category/');
  const category = isCategoryPage ? location.pathname.split('/').pop() : '';
  const endpoint = isCategoryPage ? `/api/v1/blog/category/${category}` : '/api/v1/blog/all-blog';

  const fetchBlogs = useCallback(async (pageToLoad, query, append) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const params = { page: pageToLoad, limit: PAGE_SIZE };
      if (query) params.q = query;
      const { data } = await axios.get(endpoint, { params, headers: { "Cache-Control": "no-cache" } });

      const formattedBlogs = (data.blogs || []).map(blog => ({
        ...blog,
        // Keep created_at as the raw ISO date so both the card and the
        // sidebar can format it however they like.
        userAvatar: blog.user?.profile_image,
        tags: Array.isArray(blog.tags)
          ? blog.tags.map(tag => tag?.tag_name?.trim()).filter(tag => tag && tag.length > 0)
          : []
      }));

      setBlogs(prev => append ? [...prev, ...formattedBlogs] : formattedBlogs);
      setHasMore(Boolean(data.hasMore));
      setPage(pageToLoad);
      setFetchError(false);
    } catch (error) {
      // Distinguish a fetch failure from a genuinely empty result: on a
      // non-append error we surface an error state (with retry) instead of
      // the "No blogs found" empty state.
      if (!append) {
        setBlogs([]);
        setFetchError(true);
      }
      setHasMore(false);
    } finally {
      if (append) setLoadingMore(false); else setLoading(false);
    }
  }, [endpoint]);

  // Route (category) change → reset to page 1.
  useEffect(() => {
    setSearchQuery('');
    fetchBlogs(1, '', false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Fetch the genuine trending list once per mount. On failure we quietly
  // fall back to the head of the regular feed in the sidebar.
  useEffect(() => {
    let alive = true;
    axios
      .get('/api/v1/blog/trending')
      .then(({ data }) => { if (alive) setTrending(data.success ? data.trending || [] : []); })
      .catch(() => { if (alive) setTrending([]); });
    return () => { alive = false; };
  }, []);

  // Debounced search → reset to page 1 with the new query.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchBlogs(1, searchQuery, false);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleLoadMore = () => fetchBlogs(page + 1, searchQuery, true);
  const handleCategoryClick = (cat) => navigate(`/category/${cat}`);

  // Loading skeleton mirrors the real layout (grid + sidebar) so the page
  // doesn't jump when data arrives.
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 4 } }}>
        <Box display="flex" justifyContent="center" mb={4}>
          <Box sx={{ height: 56, width: '100%', maxWidth: 560, borderRadius: 3, bgcolor: 'divider' }} />
        </Box>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <BlogGrid sx={{ gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonBlogCard key={i} />
              ))}
            </BlogGrid>
          </Grid>
          <Grid item xs={12} md={4}>
            <GlassCard sx={{ p: 3, mt: { xs: 0, md: 4 } }}>
              <Box sx={{ height: 14, width: 90, borderRadius: 999, bgcolor: 'divider', mb: 2 }} />
              <Box sx={{ height: 24, width: 140, borderRadius: 1, bgcolor: 'divider', mb: 3 }} />
              {Array.from({ length: 5 }).map((_, i) => (
                <Stack key={i} direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: 999, bgcolor: 'divider' }} />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ height: 12, width: '80%', borderRadius: 1, bgcolor: 'divider', mb: 0.75 }} />
                    <Box sx={{ height: 10, width: '50%', borderRadius: 1, bgcolor: 'divider' }} />
                  </Box>
                </Stack>
              ))}
            </GlassCard>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 4 } }}>
      {/* Search */}
      <Box display="flex" justifyContent="center" mb={4}>
        <TextField
          placeholder="Search blogs…"
          variant="outlined"
          fullWidth
          aria-label="Search blogs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ maxWidth: 560 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon /></InputAdornment>
            ),
          }}
        />
      </Box>

      <Grid container spacing={4}>
        {/* Main column */}
        <Grid item xs={12} md={8}>
          <SectionHeading
            eyebrow={isCategoryPage ? 'Category' : 'Featured'}
            title={isCategoryPage ? `Blogs in ${category}` : 'Featured Blogs'}
            badge
          />
          <BlogGrid sx={{ mt: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
            {blogs.map((blog, index) => (
              <BlogCard
                key={blog._id || index}
                id={blog._id}
                title={blog.title}
                description={blog.description}
                image={blog.image}
                username={blog.user && blog.user.username ? blog.user.username : 'Unknown'}
                time={moment(blog.created_at).format('MMM DD, YYYY')}
                profileImage={blog.userAvatar}
                tags={blog.tags}
              />
            ))}
          </BlogGrid>

          {fetchError ? (
            <Box textAlign="center" mt={5}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>Couldn’t load blogs. Please try again.</Typography>
              <GradientButton onClick={() => fetchBlogs(1, searchQuery, false)}>Retry</GradientButton>
            </Box>
          ) : blogs.length === 0 ? (
            <Box textAlign="center" mt={5}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                No blogs found{searchQuery ? ` for “${searchQuery}”` : ''}.
              </Typography>
              <Stack direction="row" spacing={1.5} justifyContent="center">
                {searchQuery && (
                  <Button variant="outlined" onClick={() => setSearchQuery('')}>Clear search</Button>
                )}
                <Button variant="outlined" onClick={() => navigate('/blogs')}>Browse all blogs</Button>
              </Stack>
            </Box>
          ) : null}

          {hasMore && (
            <Box display="flex" justifyContent="center" mt={5}>
              <GradientButton onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Load More'}
              </GradientButton>
            </Box>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <GlassCard sx={{ p: 3, mt: { xs: 0, md: 4 }, position: 'sticky', top: 88 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>Browse</Typography>
            <Typography variant="h6" sx={{ mb: 2 }}>Categories</Typography>
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} sx={{ mb: 4 }}>
              {categories.map((cat) => {
                const isActive = location.pathname.includes(`/category/${cat}`);
                return (
                  <Chip
                    key={cat}
                    label={cat}
                    color={isActive ? 'primary' : 'default'}
                    variant={isActive ? 'filled' : 'outlined'}
                    onClick={() => handleCategoryClick(cat)}
                    sx={{ cursor: 'pointer' }}
                  />
                );
              })}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <TrendingUpIcon color="primary" fontSize="small" />
              <Typography variant="h6">Trending</Typography>
            </Stack>
            {(trending.length > 0 ? trending : blogs.slice(0, 5)).map((blog, index) => (
              <Box
                key={blog._id}
                role="button"
                tabIndex={0}
                aria-label={`Read ${blog.title || 'blog'}`}
                sx={{ display: 'flex', alignItems: 'center', mb: 2, cursor: 'pointer', borderRadius: 2, p: 1, transition: 'background-color .2s ease', '&:hover': { backgroundColor: 'action.hover' } }}
                onClick={() => navigate(`/blog-details/${blog._id}`)}
                onKeyDown={onActivate(() => navigate(`/blog-details/${blog._id}`))}
              >
                <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 800, minWidth: 34 }}>
                  0{index + 1}
                </Typography>
                <UserAvatar src={blog.user?.profile_image} name={blog.user?.username} sx={{ width: 36, height: 36, mx: 1.5, fontSize: 14 }} />
                <Box flexGrow={1} sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {blog.title}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {blog.user?.username || 'Unknown'}
                    </Typography>
                    {typeof blog.likeCount === 'number' && (
                      <Stack direction="row" spacing={0.25} alignItems="center">
                        <FavoriteBorderIcon sx={{ fontSize: 12, color: 'primary.main' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {blog.likeCount}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Box>
              </Box>
            ))}
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Blogs;