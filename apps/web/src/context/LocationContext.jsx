import React, { createContext, useContext, useState, useEffect } from 'react'

const LocationContext = createContext()

export const useLocation = () => {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [permission, setPermission] = useState('prompt') // 'granted', 'denied', 'prompt'

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return Promise.reject('Geolocation not supported')
    }

    setIsLoading(true)
    setError(null)

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            
            // Reverse geocoding to get address
            const address = await reverseGeocode(latitude, longitude)
            
            const locationData = {
              latitude,
              longitude,
              address,
              timestamp: Date.now()
            }
            
            setLocation(locationData)
            localStorage.setItem('userLocation', JSON.stringify(locationData))
            setPermission('granted')
            setIsLoading(false)
            resolve(locationData)
          } catch (err) {
            setError('Failed to get address from coordinates')
            setIsLoading(false)
            reject(err)
          }
        },
        (error) => {
          let errorMessage = 'Failed to get location'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user'
              setPermission('denied')
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out'
              break
            default:
              errorMessage = 'An unknown error occurred'
              break
          }
          setError(errorMessage)
          setIsLoading(false)
          reject(errorMessage)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  // Reverse geocoding using a free service
  const reverseGeocode = async (lat, lng) => {
    try {
      // Using OpenStreetMap Nominatim (free service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      )
      const data = await response.json()
      
      if (data && data.address) {
        const { city, town, village, county, state, country } = data.address
        const cityName = city || town || village || county
        const stateName = state
        const countryName = country
        
        return {
          city: cityName,
          state: stateName,
          country: countryName,
          full: `${cityName}, ${stateName}`,
          display: `${cityName}, ${stateName}`
        }
      }
      
      return {
        city: 'Unknown',
        state: 'Unknown',
        country: 'Unknown',
        full: 'Unknown Location',
        display: 'Unknown Location'
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
      return {
        city: 'Unknown',
        state: 'Unknown',
        country: 'Unknown',
        full: 'Unknown Location',
        display: 'Unknown Location'
      }
    }
  }

  // Set location manually
  const setManualLocation = (locationData) => {
    setLocation(locationData)
    localStorage.setItem('userLocation', JSON.stringify(locationData))
  }

  // Clear location
  const clearLocation = () => {
    setLocation(null)
    localStorage.removeItem('userLocation')
  }

  // Load saved location on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation')
    if (savedLocation) {
      try {
        const locationData = JSON.parse(savedLocation)
        // Check if location is not too old (24 hours)
        if (Date.now() - locationData.timestamp < 24 * 60 * 60 * 1000) {
          setLocation(locationData)
        } else {
          localStorage.removeItem('userLocation')
        }
      } catch (error) {
        console.error('Failed to parse saved location:', error)
        localStorage.removeItem('userLocation')
      }
    }
  }, [])

  // Check geolocation permission
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermission(result.state)
      })
    }
  }, [])

  const value = {
    location,
    isLoading,
    error,
    permission,
    getCurrentLocation,
    setManualLocation,
    clearLocation
  }

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}

export default LocationContext
