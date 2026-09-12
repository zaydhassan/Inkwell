import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText, Button, Skeleton, Chip, Stack } from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import axios from 'axios';
import GlassCard from "../components/GlassCard";
import SectionHeading from "../components/SectionHeading";

const Rewards = () => {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState([]);
  const [fetchError, setFetchError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const response = await axios.get('/api/v1/rewards');
        if (response.data.success && Array.isArray(response.data.rewards)) {
          setRewards(response.data.rewards);
        } else {
          setRewards([]);
        }
      } catch (error) {
        // Surface the failure instead of masking it as an empty list.
        setFetchError(true);
        setRewards([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 4 } }}>
      <SectionHeading
        eyebrow="Spend your points"
        title="Rewards"
        subtitle="Redeem the points you've earned for perks."
        badge
        align="left"
        sx={{ mb: 4 }}
      />

      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        {loading ? (
          <Stack spacing={2}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={96} sx={{ borderRadius: 4 }} />
            ))}
          </Stack>
        ) : fetchError ? (
          <GlassCard sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Couldn't load rewards</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Something went wrong on our end. Please try again in a moment.
            </Typography>
          </GlassCard>
        ) : rewards.length > 0 ? (
          <Stack spacing={2}>
            {rewards.map(reward => (
              <GlassCard key={reward._id} glowOnHover sx={{ p: 3 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 48, height: 48, borderRadius: 2, bgcolor: "brandSoft", color: "primary.main",
                    }}>
                      <CardGiftcardIcon />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{reward.name}</Typography>
                      <Chip
                        size="small"
                        label={`${reward.costInPoints} points`}
                        color="secondary"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Stack>
                  <Button variant="contained" color="primary" onClick={() => navigate('/profile')}>
                    Redeem in Profile
                  </Button>
                </Stack>
              </GlassCard>
            ))}
          </Stack>
        ) : (
          <GlassCard sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6" sx={{ mb: 1 }}>No rewards available</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Check back soon — new rewards are added regularly.
            </Typography>
          </GlassCard>
        )}
      </Box>
    </Box>
  );
};

export default Rewards;
