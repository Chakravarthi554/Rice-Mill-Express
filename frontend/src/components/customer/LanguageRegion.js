// src/components/customer/LanguageRegion.js
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile } from '../../redux/actions/userActions';
import { useAuth } from '../../context/AuthContext';

const LanguageRegion = () => {
  const dispatch = useDispatch();
  const { userInfo } = useAuth();

  const { loading, error, success } = useSelector(state => state.userUpdateProfile);

  // LOCAL UI state – different name to avoid clash
  const [language, setLocalLanguage] = useState(userInfo?.preferences?.language || 'english');
  const [region, setLocalRegion] = useState(userInfo?.preferences?.region || 'India');

  useEffect(() => {
    if (userInfo) {
      setLocalLanguage(userInfo.preferences?.language || 'english');
      setLocalRegion(userInfo.preferences?.region || 'India');
    }
  }, [userInfo]);

  const handleSave = () => {
    dispatch(
      updateUserProfile({
        preferences: { language, region },
      })
    );
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Language & Region</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label>Language: </label>
        <select
          value={language}
          onChange={e => setLocalLanguage(e.target.value)}
        >
          <option value="english">English</option>
          <option value="hindi">Hindi</option>
          <option value="tamil">Tamil</option>
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Region: </label>
        <select
          value={region}
          onChange={e => setLocalRegion(e.target.value)}
        >
          <option value="India">India</option>
          <option value="USA">USA</option>
          <option value="UK">UK</option>
        </select>
      </div>

      <button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Updated!</p>}
    </div>
  );
};

export default LanguageRegion;