import React, { useEffect, useState, useContext } from 'react';
import { SupabaseContext } from "@/providers/supabase";
import './Leaderboard.css'; // Import the CSS file for styling

// ... existing code ...

const Leaderboard = () => {
  const { client } = useContext(SupabaseContext);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchLeaderboard();
  }, [client]);

  const fetchLeaderboard = async () => {
    const { data, error } = await client
      .from('leaderboard_view')
      .select('*')
      .order('total_score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching leaderboard:', error);
    } else {
      console.log('Fetched leaderboard data:', data); // Log the data
      setUsers(data);
    }
  };

  const updateScore = async (userId, newScore) => {
    const { error } = await client
      .from('leaderboard_view')
      .update({ total_score: newScore })
      .eq('id', userId);

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
            <span className="username">{user.Name}</span>
            <span className="score">{user.total_score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;