import React, { useEffect, useState, useContext } from 'react';
import { SupabaseContext } from "@/providers/supabase";
import './Leaderboard.css'; // Import the CSS file for styling

const Leaderboard = () => {
  const { client } = useContext(SupabaseContext);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchLeaderboard();
  }, [client]);

  const fetchLeaderboard = async () => {
    let allUsers = [];
    let limit = 20; // Fetch more than 10 to account for blocked users
    let offset = 0;

    while (allUsers.length < 10) {
      const { data, error } = await client
        .from('leaderboard_view')
        .select('user_id, name, total_score')
        .order('total_score', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        break;
      } else {
        console.log('Fetched leaderboard data:', data);

        // List of user IDs to block
        const blockedUserIds = ['12ec42a1-b566-4b18-b3fc-4d3b8c4b0569','e9c41ee7-a0fc-4c3f-bcb1-0a183ef7b237','734799f6-e29e-418b-96b4-15d7d4bee781','e890f913-b42f-4267-8cee-f6f2aa3db767','7bf6d053-a3ad-4450-a41d-12731cf1bedc','7cb073f9-7db3-43a5-97f0-2df6c3b92a48','83d78dd1-8839-4350-a7a9-1ca84c80fec3','f0a4fba7-d932-4283-9eed-640727490efa'];

        // Filter out blocked users by user_id
        const filteredData = data.filter(user => !blockedUserIds.includes(user.user_id));

        allUsers = [...allUsers, ...filteredData];
        offset += limit;

        // If we have enough users, break the loop
        if (allUsers.length >= 10) {
          break;
        }
      }
    }

    // Ensure only 10 users are set
    setUsers(allUsers.slice(0, 10));
  };

  const updateScore = async (userId, newScore) => {
    const { error } = await client
      .from('leaderboard_view')
      .update({ total_score: newScore })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating score:', error);
    } else {
      console.log(`Score updated for user ID ${userId}`);
      fetchLeaderboard(); // Refresh the leaderboard after updating the score
    }
  };

  const getRankEmoji = (index) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `${index + 1} ⭐`;
    }
  };

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <ul>
        {users.map((user, index) => (
          <li key={index} className="leaderboard-item">
            <span className="rank">{getRankEmoji(index)}</span>
            <span className="username">{user.name}</span>
            <span className="score">{user.total_score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;