import React, { useState, useEffect } from 'react';
import {
  getMeasurementsBySession,
  createMeasurement,
  deleteMeasurement,
  deleteSessionMeasurements,
} from '../services/measurementApi';

const LoggedReadings = ({ sessionId, batchId }) => {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newReading, setNewReading] = useState({
    readingType: 'temperature',
    value: '',
    unit: '°C',
    status: 'normal',
    notes: '',
    location: '',
  });

  // Fetch readings on component mount
  useEffect(() => {
    if (sessionId) {
      fetchReadings();
    }
  }, [sessionId]);

  const fetchReadings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMeasurementsBySession(sessionId);
      setReadings(response.measurements || []);
    } catch (err) {
      setError('Failed to load readings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReading = async (e) => {
    e.preventDefault();

    if (!newReading.value) {
      setError('Value is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createMeasurement({
        sessionId,
        batchId,
        readingType: newReading.readingType,
        value: parseFloat(newReading.value),
        unit: newReading.unit,
        status: newReading.status,
        notes: newReading.notes,
        location: newReading.location,
      });

      // Reset form
      setNewReading({
        readingType: 'temperature',
        value: '',
        unit: '°C',
        status: 'normal',
        notes: '',
        location: '',
      });

      // Refresh readings
      await fetchReadings();
    } catch (err) {
      setError('Failed to add reading');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReading = async (readingId) => {
    if (!window.confirm('Are you sure you want to delete this reading?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await deleteMeasurement(readingId);
      await fetchReadings();
    } catch (err) {
      setError('Failed to delete reading');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete all ${readings.length} readings from this session?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await deleteSessionMeasurements(sessionId);
      setReadings([]);
    } catch (err) {
      setError('Failed to delete all readings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getReadingTypeIcon = (type) => {
    switch (type) {
      case 'temperature':
        return '🌡️';
      case 'salinity':
        return '🧂';
      case 'ph':
        return '⚗️';
      case 'boiling':
        return '🔥';
      case 'mechanical':
        return '⚙️';
      default:
        return '📊';
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          📊 Logged Readings ({readings.length} records captured)
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Add New Reading Form */}
        <form
          onSubmit={handleAddReading}
          className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Add New Reading
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Reading Type
              </label>
              <select
                value={newReading.readingType}
                onChange={(e) =>
                  setNewReading({ ...newReading, readingType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="temperature">Temperature</option>
                <option value="salinity">Salinity</option>
                <option value="ph">pH</option>
                <option value="boiling">Boiling</option>
                <option value="mechanical">Mechanical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Value *
              </label>
              <input
                type="number"
                step="0.01"
                value={newReading.value}
                onChange={(e) =>
                  setNewReading({ ...newReading, value: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter value"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Unit
              </label>
              <input
                type="text"
                value={newReading.unit}
                onChange={(e) =>
                  setNewReading({ ...newReading, unit: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="°C, %, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Status
              </label>
              <select
                value={newReading.status}
                onChange={(e) =>
                  setNewReading({ ...newReading, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Notes
              </label>
              <input
                type="text"
                value={newReading.notes}
                onChange={(e) =>
                  setNewReading({ ...newReading, notes: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add notes (optional)"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Location
              </label>
              <input
                type="text"
                value={newReading.location}
                onChange={(e) =>
                  setNewReading({ ...newReading, location: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Chamber A, Tank B, etc."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Adding...' : '➕ Add Reading'}
          </button>
        </form>

        {/* Readings List */}
        {readings.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-600 text-lg">No readings recorded yet.</p>
            <p className="text-gray-500 text-sm mt-2">
              Add your first reading using the form above.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-700">
                Reading History
              </h3>
              <button
                onClick={handleDeleteAll}
                disabled={loading || readings.length === 0}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                🗑️ Delete All
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {readings.map((reading) => (
                <div
                  key={reading._id}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getReadingTypeIcon(reading.readingType)}
                      </span>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {reading.readingType.charAt(0).toUpperCase() +
                            reading.readingType.slice(1)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(reading.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`${getStatusBadgeColor(
                          reading.status
                        )} text-white px-3 py-1 rounded-full text-sm font-medium`}
                      >
                        {reading.status.toUpperCase()}
                      </span>

                      <button
                        onClick={() => handleDeleteReading(reading._id)}
                        disabled={loading}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        title="Delete this reading"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                    <div>
                      <div className="text-xs text-gray-600">Value</div>
                      <div className="text-lg font-bold text-gray-800">
                        {reading.value} {reading.unit}
                      </div>
                    </div>
                    {reading.location && (
                      <div>
                        <div className="text-xs text-gray-600">Location</div>
                        <div className="text-sm font-semibold text-gray-800">
                          {reading.location}
                        </div>
                      </div>
                    )}
                  </div>

                  {reading.notes && (
                    <div className="text-sm text-gray-700 bg-white p-2 rounded mt-2 border-l-2 border-blue-400">
                      <span className="font-semibold">Note:</span> {reading.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoggedReadings;
