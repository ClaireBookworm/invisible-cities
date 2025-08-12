import React, { useState, useMemo } from 'react';

const InvisibleCitiesExplorer = () => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [annotations, setAnnotations] = useState({});
  const [hoveredAnnotation, setHoveredAnnotation] = useState(null);

  // placeholder cities - replace with actual calvino text
  // const cities = [
  //   {
  //     id: 'zenobia',
  //     name: 'Zenobia',
  //     category: 'Cities & Memory',
  //     text: `In Zenobia, the traveler finds himself among buildings of remarkable height, suspended bridges connecting one district to another, streets that wind upward in spirals. Yet what makes the city truly memorable is not its architecture but the quality of light that filters through its spaces at different hours of the day. [annotation-1]The morning light catches the copper weathervanes[/annotation-1] and sends geometric shadows across the white stone plazas. By evening, the same plazas glow amber, and the sounds of the city - merchants calling, children playing, water flowing through hidden channels - seem to carry farther in the golden air.`,
  //     image: '/api/placeholder/400/300',
  //     tags: ['memory', 'architecture', 'light']
  //   },
  //   {
  //     id: 'tamara',
  //     name: 'Tamara',
  //     category: 'Cities & Signs',
  //     text: `You walk for days among trees and among stones. [annotation-2]Rarely does the eye light on a thing[/annotation-2], and then only when it has recognized that thing as the sign of another thing: a print in the sand indicates the tiger's passage; a marsh announces a vein of water; the hibiscus flower, the end of winter. All the rest is silent and interchangeable; trees and stones are only what they are.`,
  //     image: '/api/placeholder/400/300',
  //     tags: ['signs', 'nature', 'meaning']
  //   },
  //   {
  //     id: 'despina',
  //     name: 'Despina',
  //     category: 'Cities & Desire',
  //     text: `From two different directions, two different cities appear. [annotation-3]The camel driver who arrives from the desert[/annotation-3] sees the profile of towers, battlements, domes emerging from the sand dunes. The sailor who arrives from the sea distinguishes the outline of the same city against the sky, but to him it appears as a ship's hull riding the waves, its masts the towers, its rigging the bridges suspended in air.`,
  //     image: '/api/placeholder/400/300',
  //     tags: ['desire', 'perspective', 'journey']
  //   }
  // ];

  // sample annotations - you'd expand this
  const annotationData = {
    'annotation-1': {
      note: 'calvino often uses metal and stone as contrasting elements - the organic copper against geometric stone',
      color: 'blue',
      tags: ['materials', 'contrast']
    },
    'annotation-2': {
      note: 'classic calvino move - the eye/sight as active agent in meaning-making',
      color: 'purple',
      tags: ['perception', 'semiotics']
    },
    'annotation-3': {
      note: 'the desert/sea duality runs through multiple cities - modes of arrival shape perception',
      color: 'orange',
      tags: ['duality', 'arrival', 'perspective']
    }
  };

  const filteredCities = useMemo(() => {
    return cities.filter(city =>
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm]);

  const renderAnnotatedText = (text) => {
    return text.split(/(\[annotation-\d+\].*?\[\/annotation-\d+\])/).map((part, index) => {
      const match = part.match(/\[annotation-(\d+)\](.*?)\[\/annotation-\d+\]/);
      if (match) {
        const annotationId = `annotation-${match[1]}`;
        const content = match[2];
        const annotation = annotationData[annotationId];
        
        return (
          <span
            key={index}
            className={`relative cursor-pointer px-1 rounded transition-all duration-200 ${
              annotation ? `bg-${annotation.color}-100 hover:bg-${annotation.color}-200 border-l-2 border-${annotation.color}-400` : 'bg-gray-100'
            }`}
            onMouseEnter={() => setHoveredAnnotation(annotationId)}
            onMouseLeave={() => setHoveredAnnotation(null)}
          >
            {content}
            {hoveredAnnotation === annotationId && annotation && (
              <div className="absolute z-10 p-3 bg-white border border-gray-200 rounded-lg shadow-lg max-w-xs -top-2 left-0 transform -translate-y-full">
                <div className="text-sm text-gray-800 mb-2">{annotation.note}</div>
                <div className="flex gap-1 flex-wrap">
                  {annotation.tags.map(tag => (
                    <span key={tag} className={`px-2 py-1 text-xs rounded bg-${annotation.color}-100 text-${annotation.color}-800`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const tagColors = {
    'memory': 'blue',
    'architecture': 'green',
    'light': 'yellow',
    'signs': 'purple',
    'nature': 'green',
    'meaning': 'indigo',
    'desire': 'red',
    'perspective': 'pink',
    'journey': 'orange'
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">invisible cities</h1>
          <p className="text-gray-600 font-light">italo calvino</p>
        </div>

        {/* search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="search cities, categories, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-8">
          {/* city list */}
          <div className="w-80 space-y-3">
            {filteredCities.map(city => (
              <div
                key={city.id}
                onClick={() => setSelectedCity(city)}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedCity?.id === city.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium text-gray-900 mb-1">{city.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{city.category}</p>
                <div className="flex gap-1 flex-wrap">
                  {city.tags.map(tag => (
                    <span
                      key={tag}
                      className={`px-2 py-1 text-xs rounded bg-${tagColors[tag] || 'gray'}-100 text-${tagColors[tag] || 'gray'}-800`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* city detail */}
          <div className="flex-1">
            {selectedCity ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-light text-gray-900 mb-1">{selectedCity.name}</h2>
                  <p className="text-gray-600 font-light mb-4">{selectedCity.category}</p>
                  
                  {selectedCity.image && (
                    <img
                      src={selectedCity.image}
                      alt={selectedCity.name}
                      className="w-full max-w-lg h-64 object-cover rounded-lg mb-6"
                    />
                  )}
                </div>

                <div className="prose max-w-none">
                  <div className="text-gray-900 leading-relaxed text-lg">
                    {renderAnnotatedText(selectedCity.text)}
                  </div>
                </div>

                {/* tags */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex gap-2 flex-wrap">
                    {selectedCity.tags.map(tag => (
                      <span
                        key={tag}
                        className={`px-3 py-1 text-sm rounded-full bg-${tagColors[tag] || 'gray'}-100 text-${tagColors[tag] || 'gray'}-800`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-500">
                select a city to begin exploring
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvisibleCitiesExplorer;