import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './TickerWidget.css';

/**
 * Ticker Widget Component
 * Displays scrolling text, news feed, or rotating announcements
 */
const TickerWidget = ({
  widgetId,
  config = {},
  data = null,
  onRefresh,
  onConfigure,
  isEditing = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const tickerRef = useRef(null);
  const intervalRef = useRef(null);

  // Default configuration
  const defaultConfig = {
    title: 'Ticker',
    speed: 2000, // milliseconds between items
    direction: 'horizontal', // horizontal, vertical
    animation: 'scroll', // scroll, fade, slide
    autoPlay: true,
    showControls: true,
    pauseOnHover: true,
    showIndicators: false,
    loop: true,
    textColor: '#333',
    backgroundColor: 'transparent',
    fontSize: '0.875rem',
    fontWeight: 'normal',
    maxItems: 50
  };

  const mergedConfig = { ...defaultConfig, ...config };

  // Process ticker data
  const tickerItems = React.useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.slice(0, mergedConfig.maxItems).map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: index,
          text: item,
          timestamp: new Date().toISOString()
        };
      }

      return {
        id: item.id || index,
        text: item.text || item.message || item.title || '',
        url: item.url,
        timestamp: item.timestamp || item.createdAt,
        type: item.type,
        priority: item.priority,
        source: item.source,
        ...item
      };
    });
  }, [data, mergedConfig.maxItems]);

  // Auto-advance ticker
  useEffect(() => {
    if (!isPlaying || !tickerItems.length || tickerItems.length <= 1) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        if (mergedConfig.loop) {
          return (prev + 1) % tickerItems.length;
        } else {
          return prev + 1 < tickerItems.length ? prev + 1 : prev;
        }
      });
    }, mergedConfig.speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, tickerItems.length, mergedConfig.speed, mergedConfig.loop]);

  // Reset index when data changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [data]);

  // Auto-play configuration
  useEffect(() => {
    setIsPlaying(mergedConfig.autoPlay);
  }, [mergedConfig.autoPlay]);

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setLoading(true);
    setError(null);

    try {
      await onRefresh();
      setCurrentIndex(0);
    } catch (err) {
      setError('Failed to refresh ticker data');
      console.error('Ticker widget refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (tickerItems.length === 0) return;

    setCurrentIndex(prev => {
      if (mergedConfig.loop) {
        return (prev + 1) % tickerItems.length;
      } else {
        return prev + 1 < tickerItems.length ? prev + 1 : prev;
      }
    });
  };

  const handlePrevious = () => {
    if (tickerItems.length === 0) return;

    setCurrentIndex(prev => {
      if (mergedConfig.loop) {
        return prev === 0 ? tickerItems.length - 1 : prev - 1;
      } else {
        return prev > 0 ? prev - 1 : prev;
      }
    });
  };

  const handleItemClick = (item) => {
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderTickerItem = (item, index) => {
    const isActive = index === currentIndex;
    const itemStyle = {
      color: mergedConfig.textColor,
      fontSize: mergedConfig.fontSize,
      fontWeight: mergedConfig.fontWeight
    };

    return (
      <div
        key={item.id}
        className={`ticker-item ${isActive ? 'active' : ''} ${mergedConfig.animation}`}
        style={itemStyle}
        onClick={() => handleItemClick(item)}
      >
        <div className="ticker-text">
          {item.text}
        </div>

        {item.timestamp && (
          <div className="ticker-meta">
            <span className="ticker-time">
              {formatTimestamp(item.timestamp)}
            </span>
            {item.source && (
              <span className="ticker-source">
                • {item.source}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="ticker-widget">
        <div className="widget-header">
          <h3>{mergedConfig.title}</h3>
        </div>
        <div className="widget-content">
          <div className="loading-state">
            <div className="loading-spinner" />
            <span>Loading ticker data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="ticker-widget">
        <div className="widget-header">
          <h3>{mergedConfig.title}</h3>
          <div className="widget-actions">
            <button className="widget-action-btn" onClick={handleRefresh} title="Retry">
              <i className="fa-solid fa-refresh" />
            </button>
          </div>
        </div>
        <div className="widget-content">
          <div className="error-state">
            <i className="fa-solid fa-exclamation-triangle" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!tickerItems.length) {
    return (
      <div className="ticker-widget">
        <div className="widget-header">
          <h3>{mergedConfig.title}</h3>
          <div className="widget-actions">
            <button className="widget-action-btn" onClick={handleRefresh} title="Refresh">
              <i className="fa-solid fa-refresh" />
            </button>
            {onConfigure && (
              <button className="widget-action-btn" onClick={onConfigure} title="Configure">
                <i className="fa-solid fa-cog" />
              </button>
            )}
          </div>
        </div>
        <div className="widget-content">
          <div className="no-data-state">
            <i className="fa-solid fa-refresh" />
            <span>No ticker items to display</span>
          </div>
        </div>
      </div>
    );
  }

  const containerStyle = {
    backgroundColor: mergedConfig.backgroundColor
  };

  return (
    <div className="ticker-widget">
      <div className="widget-header">
        <h3>{mergedConfig.title}</h3>
        <div className="widget-actions">
          <button
            className="widget-action-btn"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh"
          >
            <i className="fa-solid fa-refresh" />
          </button>
          {onConfigure && (
            <button className="widget-action-btn" onClick={onConfigure} title="Configure">
              <i className="fa-solid fa-cog" />
            </button>
          )}
        </div>
      </div>

      <div className="widget-content" style={containerStyle}>
        <div
          className={`ticker-container ${mergedConfig.direction} ${mergedConfig.pauseOnHover ? 'pause-on-hover' : ''}`}
          ref={tickerRef}
          onMouseEnter={() => mergedConfig.pauseOnHover && setIsPlaying(false)}
          onMouseLeave={() => mergedConfig.pauseOnHover && mergedConfig.autoPlay && setIsPlaying(true)}
        >
          <div className="ticker-track">
            {tickerItems.map((item, index) => renderTickerItem(item, index))}
          </div>
        </div>

        {mergedConfig.showControls && tickerItems.length > 1 && (
          <div className="ticker-controls">
            <button
              className="control-btn"
              onClick={handlePrevious}
              title="Previous"
              disabled={!mergedConfig.loop && currentIndex === 0}
            >
              <i className="fa-solid fa-refresh" />
            </button>

            <button
              className="control-btn play-pause"
              onClick={handlePlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              <i className="fa-solid fa-refresh" />
            </button>

            <button
              className="control-btn"
              onClick={handleNext}
              title="Next"
              disabled={!mergedConfig.loop && currentIndex >= tickerItems.length - 1}
            >
              <i className="fa-solid fa-refresh" />
            </button>
          </div>
        )}

        {mergedConfig.showIndicators && tickerItems.length > 1 && (
          <div className="ticker-indicators">
            {tickerItems.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}

        <div className="widget-meta">
          {tickerItems.length > 0 && (
            <span>
              {currentIndex + 1} of {tickerItems.length} items
              {isPlaying && ' • Playing'}
            </span>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="widget-config-preview">
          <span>Speed: {mergedConfig.speed}ms</span>
          <span>Direction: {mergedConfig.direction}</span>
          <span>Items: {tickerItems.length}</span>
        </div>
      )}
    </div>
  );
};

TickerWidget.propTypes = {
  widgetId: PropTypes.string.isRequired,
  config: PropTypes.object,
  data: PropTypes.array,
  onRefresh: PropTypes.func,
  onConfigure: PropTypes.func,
  isEditing: PropTypes.bool
};

export default TickerWidget;

