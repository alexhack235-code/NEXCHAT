/**
 * Canada Provinces & Territories Atlas Data (All 14 Sections)
 * Exposes `window.CANADA_PROVINCES` (ordered array with `.byId` lookup map)
 * and `window.CANADA_PROVINCES_MAP` for O(1) lookup by provinceId.
 */
(function (global) {
  'use strict';

  const PROVINCES_LIST = [
    {
      id: 'ontario',
      abbr: 'ON',
      name: 'Ontario',
      title: 'Ontario — Great Lakes & CN Tower',
      capital: 'Toronto',
      majorCities: ['Toronto', 'Ottawa', 'Hamilton', 'London', 'Kingston', 'Thunder Bay'],
      highway: 'Hwy 401 / QEW',
      biome: 'great-lakes-metro',
      climate: {
        tempC: 16,
        weather: 'Crisp Lakefront Breeze',
        skyTop: '#0b2242',
        skyHorizon: '#4e89b8',
        fogColor: '#8db4d2',
        sunColor: '#fff3d6',
        groundColor: '#2d4a36',
        waterColor: '#134e7a',
        accent: '#f59e0b'
      },
      landmarks: [
        {
          id: 'cn-tower',
          name: 'CN Tower',
          coords: [0, 0, -55],
          elevationM: 553,
          description: '553.3 m concrete communications and observation tower anchoring the Toronto skyline above Lake Ontario.'
        },
        {
          id: 'rogers-centre',
          name: 'Rogers Harbour Dome',
          coords: [-42, 0, -42],
          elevationM: 86,
          description: 'Iconic retractable-roof stadium beside the CN Tower along the Toronto waterfront rail corridor.'
        },
        {
          id: 'niagara-falls',
          name: 'Niagara Horseshoe Falls',
          coords: [78, 0, 52],
          elevationM: 51,
          description: 'Thundering emerald-white cataract plunging 51 metres into the Niagara Gorge with constant rising mist.'
        }
      ],
      codexFacts: [
        'Ontario borders four of the five Great Lakes: Superior, Huron, Erie, and Ontario.',
        'Highway 401 is North America’s busiest highway corridor, linking Windsor through Toronto to the Quebec border.',
        'Completed in 1976, the CN Tower held the world’s tallest free-standing structure record for 32 years.'
      ],
      href: 'province-ontario.html'
    },
    {
      id: 'quebec',
      abbr: 'QC',
      name: 'Quebec',
      title: 'Quebec — St. Lawrence & Château Frontenac',
      capital: 'Québec City',
      majorCities: ['Montréal', 'Québec City', 'Laval', 'Gatineau', 'Sherbrooke', 'Trois-Rivières'],
      highway: 'Autoroute 20 / 40',
      biome: 'st-lawrence-citadel',
      climate: {
        tempC: 13,
        weather: 'St. Lawrence River Mist',
        skyTop: '#0f2544',
        skyHorizon: '#5f87b0',
        fogColor: '#9ab3ca',
        sunColor: '#ffeccf',
        groundColor: '#364f3b',
        waterColor: '#17486d',
        accent: '#38bdf8'
      },
      landmarks: [
        {
          id: 'chateau-frontenac',
          name: 'Château Frontenac',
          coords: [0, 10, -58],
          elevationM: 80,
          description: 'Copper-turreted railway grand hotel crowning Cap Diamant above Old Québec and the St. Lawrence River.'
        },
        {
          id: 'st-lawrence-port',
          name: 'St. Lawrence Riverfront & Citadel',
          coords: [54, 0, -28],
          elevationM: 35,
          description: 'Historic fortified promontory and deep-water maritime corridor connecting the Great Lakes to the Atlantic.'
        },
        {
          id: 'montreal-olympic-tower',
          name: 'Montréal Inclined Tower',
          coords: [-72, 0, 44],
          elevationM: 165,
          description: '165-metre 45-degree inclined concrete tower rising over Hochelaga and the St. Lawrence bridges.'
        }
      ],
      codexFacts: [
        'Québec City is the only fortified walled city north of Mexico, founded by Samuel de Champlain in 1608.',
        'The St. Lawrence River drains the Great Lakes and stretches over 1,197 km to the Gulf of St. Lawrence.',
        'Montréal’s Olympic Tower is the tallest inclined structure in the world at a 45-degree angle.'
      ],
      href: 'province-quebec.html'
    },
    {
      id: 'british-columbia',
      abbr: 'BC',
      name: 'British Columbia',
      title: 'British Columbia — Coast Mountains & Pacific Fjord',
      capital: 'Victoria',
      majorCities: ['Vancouver', 'Victoria', 'Kelowna', 'Surrey', 'Whistler', 'Prince George'],
      highway: 'Trans-Canada Hwy 1 / Sea-to-Sky 99',
      biome: 'pacific-fjord',
      climate: {
        tempC: 14,
        weather: 'Pacific Marine Mist',
        skyTop: '#0a2a3f',
        skyHorizon: '#5693a8',
        fogColor: '#8eb8c5',
        sunColor: '#fff5de',
        groundColor: '#1f4432',
        waterColor: '#0e4c64',
        accent: '#22d3ee'
      },
      landmarks: [
        {
          id: 'canada-place',
          name: 'Canada Place Sails',
          coords: [-18, 0, -48],
          elevationM: 42,
          description: 'Five iconic white tensioned-fabric sails jutting into Burrard Inlet at Vancouver’s Pacific waterfront.'
        },
        {
          id: 'lions-gate-bridge',
          name: 'Lions Gate Suspension Bridge',
          coords: [62, 0, -18],
          elevationM: 111,
          description: 'Emerald-green art deco suspension bridge spanning First Narrows between Stanley Park and the North Shore.'
        },
        {
          id: 'coast-mountains-fjord',
          name: 'Coast Mountains & Howe Sound',
          coords: [-64, 0, -88],
          elevationM: 1850,
          description: 'Glaciated granite peaks plunging straight into deep Pacific fjord waters and temperate Douglas-fir rainforest.'
        }
      ],
      codexFacts: [
        'British Columbia has more than 25,700 km of coastline including Vancouver Island and Haida Gwaii.',
        'Lions Gate Bridge opened in 1938 and links downtown Vancouver to the Coast Mountains.',
        'Temperate coastal rainforests in BC host centuries-old Western Red Cedar and Sitka Spruce.'
      ],
      href: 'province-british-columbia.html'
    },
    {
      id: 'alberta',
      abbr: 'AB',
      name: 'Alberta',
      title: 'Alberta — Bow River Skyline & Banff Rockies',
      capital: 'Edmonton',
      majorCities: ['Calgary', 'Edmonton', 'Banff', 'Red Deer', 'Lethbridge', 'Jasper'],
      highway: 'Trans-Canada Hwy 1 / Hwy 2',
      biome: 'rockies-foothills',
      climate: {
        tempC: 9,
        weather: 'Chinook Alpine Clear',
        skyTop: '#0c264c',
        skyHorizon: '#6ea2ce',
        fogColor: '#a8c6df',
        sunColor: '#fff0cc',
        groundColor: '#48593a',
        waterColor: '#1a8b9d',
        accent: '#f59e0b'
      },
      landmarks: [
        {
          id: 'calgary-tower',
          name: 'Calgary Tower & Bow Skyline',
          coords: [0, 0, -52],
          elevationM: 191,
          description: '191-metre observation spire overlooking the Bow River Valley and glass towers of downtown Calgary.'
        },
        {
          id: 'banff-rockies',
          name: 'Banff Rundle & Cascade Massif',
          coords: [-76, 0, -84],
          elevationM: 2948,
          description: 'Dramatic tilted limestone strata of the Canadian Rockies rising sharply above spruce foothills.'
        },
        {
          id: 'lake-louise',
          name: 'Lake Louise Glacial Basin',
          coords: [68, 0, -68],
          elevationM: 1750,
          description: 'Turquoise rock-flour glacial lake cradled beneath Victoria Glacier and subalpine larch slopes.'
        }
      ],
      codexFacts: [
        'Banff National Park, established in 1885, is Canada’s oldest national park.',
        'Lake Louise owes its vivid turquoise colour to finely ground glacial silt suspended in meltwater.',
        'Warm Chinook winds sweeping down the eastern slopes of the Rockies can raise Alberta temperatures by 20 °C in hours.'
      ],
      href: 'province-alberta.html'
    },
    {
      id: 'national-capital',
      abbr: 'NCR',
      name: 'National Capital Region',
      title: 'National Capital — Parliament Hill & Rideau Canal',
      capital: 'Ottawa',
      majorCities: ['Ottawa', 'Gatineau', 'Kanata', 'Orléans', 'Hull'],
      highway: 'Hwy 417 Queensway / Autoroute 5',
      biome: 'capital-canal',
      climate: {
        tempC: 11,
        weather: 'Crisp Ottawa Valley Sun',
        skyTop: '#0d2240',
        skyHorizon: '#5e8bb5',
        fogColor: '#98b4cc',
        sunColor: '#ffeec9',
        groundColor: '#2f4e37',
        waterColor: '#184b6e',
        accent: '#ef4444'
      },
      landmarks: [
        {
          id: 'peace-tower',
          name: 'Parliament Hill & Peace Tower',
          coords: [0, 0, -56],
          elevationM: 92,
          description: 'High Victorian Gothic Revival Centre Block crowned by the 92.2 m Peace Tower and patinated copper roofs.'
        },
        {
          id: 'rideau-canal',
          name: 'Rideau Canal Locks',
          coords: [46, 0, -16],
          elevationM: 60,
          description: 'UNESCO World Heritage 202-km canal and winter skateway winding past Chateau Laurier to the Ottawa River.'
        },
        {
          id: 'alexandra-bridge',
          name: 'Alexandra Interprovincial Bridge',
          coords: [-58, 0, -44],
          elevationM: 45,
          description: 'Cantilever steel truss bridge linking Ottawa, Ontario and Gatineau, Quebec across the Ottawa River.'
        }
      ],
      codexFacts: [
        'Opened in 1832, the Rideau Canal is the oldest continuously operated canal system in North America.',
        'In winter, a 7.8-km stretch of the Rideau Canal freezes into the world’s largest naturally frozen skating rink.',
        'The Peace Tower carillon houses 53 bronze bells and commemorates Canadians who served in WWI.'
      ],
      href: 'province-national-capital.html'
    },
    {
      id: 'nova-scotia',
      abbr: 'NS',
      name: 'Nova Scotia',
      title: 'Nova Scotia — Peggy’s Cove & Atlantic Coast',
      capital: 'Halifax',
      majorCities: ['Halifax', 'Dartmouth', 'Sydney', 'Truro', 'Lunenburg', 'Yarmouth'],
      highway: 'Hwy 102 / Cabot Trail',
      biome: 'granite-lighthouse',
      climate: {
        tempC: 10,
        weather: 'North Atlantic Sea Spray',
        skyTop: '#0a213b',
        skyHorizon: '#5b8aa8',
        fogColor: '#9db9c9',
        sunColor: '#fff1d4',
        groundColor: '#4e5456',
        waterColor: '#0e3c5c',
        accent: '#fb7185'
      },
      landmarks: [
        {
          id: 'peggys-cove-lighthouse',
          name: 'Peggy’s Point Lighthouse',
          coords: [0, 4, -52],
          elevationM: 15,
          description: 'Iconic 1915 octagonal white-and-red beacon perched on glacially scoured Devonian granite boulders.'
        },
        {
          id: 'granite-headland',
          name: 'Peggy’s Cove Granite Batholith',
          coords: [-38, 0, -28],
          elevationM: 12,
          description: 'Smooth wave-swept coastal granite ledges meeting the surging swells of St. Margarets Bay.'
        },
        {
          id: 'halifax-harbour-pier',
          name: 'Halifax Harbour & Pier 21',
          coords: [68, 0, 36],
          elevationM: 8,
          description: 'One of the world’s deepest ice-free natural harbours guarded by Citadel Hill.'
        }
      ],
      codexFacts: [
        'Peggy’s Point Lighthouse has guided North Atlantic mariners since 1868 (current concrete tower built 1915).',
        'No point in Nova Scotia is more than 67 km from the ocean.',
        'Halifax Harbour is the second-largest natural harbour in the world after Sydney, Australia.'
      ],
      href: 'province-nova-scotia.html'
    },
    {
      id: 'newfoundland',
      abbr: 'NL',
      name: 'Newfoundland & Labrador',
      title: 'Newfoundland — Signal Hill & Iceberg Alley',
      capital: 'St. John’s',
      majorCities: ['St. John’s', 'Corner Brook', 'Mount Pearl', 'Gander', 'Happy Valley-Goose Bay'],
      highway: 'Trans-Canada Hwy 1',
      biome: 'atlantic-iceberg',
      climate: {
        tempC: 5,
        weather: 'Labrador Current Chill',
        skyTop: '#091f38',
        skyHorizon: '#5585a3',
        fogColor: '#9cb7c7',
        sunColor: '#fff2d8',
        groundColor: '#3c4a3e',
        waterColor: '#0b3859',
        accent: '#38bdf8'
      },
      landmarks: [
        {
          id: 'cabot-tower',
          name: 'Signal Hill Cabot Tower',
          coords: [0, 12, -56],
          elevationM: 150,
          description: 'Sandstone tower on Signal Hill where Guglielmo Marconi received the first transatlantic wireless signal in 1901.'
        },
        {
          id: 'jellybean-row',
          name: 'Jellybean Row Heritage Terrace',
          coords: [-52, 0, -18],
          elevationM: 25,
          description: 'Steep St. John’s clapboard rowhouses painted in vibrant yellow, crimson, cobalt, and teal.'
        },
        {
          id: 'iceberg-alley',
          name: 'Iceberg Alley Tabular Bergs',
          coords: [66, 0, -48],
          elevationM: 45,
          description: '10,000-year-old Greenland glacial icebergs drifting south along the Labrador Current.'
        }
      ],
      codexFacts: [
        'Cape Spear near St. John’s is the easternmost point in North America.',
        'On December 12, 1901, Marconi received the letter "S" in Morse code at Signal Hill from Cornwall, England.',
        'L’Anse aux Meadows in northern Newfoundland is the only confirmed Norse Viking settlement in North America (~1000 CE).'
      ],
      href: 'province-newfoundland.html'
    },
    {
      id: 'new-brunswick',
      abbr: 'NB',
      name: 'New Brunswick',
      title: 'New Brunswick — Hopewell Rocks & Bay of Fundy',
      capital: 'Fredericton',
      majorCities: ['Moncton', 'Saint John', 'Fredericton', 'Dieppe', 'Miramichi', 'Bathurst'],
      highway: 'Trans-Canada Hwy 2',
      biome: 'fundy-coast',
      climate: {
        tempC: 12,
        weather: 'Fundy Tidal Surge',
        skyTop: '#0b223d',
        skyHorizon: '#638ca8',
        fogColor: '#a2b9c7',
        sunColor: '#ffefd0',
        groundColor: '#3f523a',
        waterColor: '#194a63',
        accent: '#fb923c'
      },
      landmarks: [
        {
          id: 'hopewell-rocks',
          name: 'Hopewell Flowerpot Rocks',
          coords: [0, 0, -52],
          elevationM: 21,
          description: 'Red sandstone sea stacks sculpted by the world’s highest tides and topped with resilient spruce trees.'
        },
        {
          id: 'fundy-cliffs',
          name: 'Bay of Fundy Red Cliffs',
          coords: [-56, 0, -34],
          elevationM: 32,
          description: 'Iron-rich conglomerate cliffs experiencing 16-metre vertical tidal swings twice every day.'
        },
        {
          id: 'reversing-falls-bridge',
          name: 'Saint John Harbour Span',
          coords: [64, 0, 28],
          elevationM: 40,
          description: 'Steel arch crossing over the tidal gorge where Fundy’s surge reverses the Saint John River.'
        }
      ],
      codexFacts: [
        'The Bay of Fundy has the highest tidal range on Earth, reaching up to 16.3 metres (53 ft).',
        'New Brunswick is Canada’s only officially bilingual province.',
        'Hartland Covered Bridge in New Brunswick is the longest covered bridge in the world at 391 metres.'
      ],
      href: 'province-new-brunswick.html'
    },
    {
      id: 'prince-edward-island',
      abbr: 'PE',
      name: 'Prince Edward Island',
      title: 'Prince Edward Island — Confederation Bridge & Red Cliffs',
      capital: 'Charlottetown',
      majorCities: ['Charlottetown', 'Summerside', 'Stratford', 'Cornwall', 'Cavendish'],
      highway: 'Trans-Canada Hwy 1',
      biome: 'red-sand-island',
      climate: {
        tempC: 14,
        weather: 'Gulf of St. Lawrence Breeze',
        skyTop: '#0d294a',
        skyHorizon: '#6aa2c9',
        fogColor: '#a5c8dc',
        sunColor: '#fff3d6',
        groundColor: '#4c6e38',
        waterColor: '#155c82',
        accent: '#f97316'
      },
      landmarks: [
        {
          id: 'confederation-bridge',
          name: 'Confederation Bridge',
          coords: [20, 0, -58],
          elevationM: 60,
          description: '12.9-km curved concrete box-girder bridge spanning the Abegweit Passage of Northumberland Strait.'
        },
        {
          id: 'green-gables',
          name: 'Green Gables Heritage House',
          coords: [-52, 0, 22],
          elevationM: 12,
          description: 'White farmhouse with forest-green gables in Cavendish that inspired L.M. Montgomery’s Anne of Green Gables.'
        },
        {
          id: 'point-prim-lighthouse',
          name: 'Red Sandstone Cliffs & Lighthouse',
          coords: [-64, 0, -32],
          elevationM: 18,
          description: 'Iron-oxide red sandstone bluffs paired with a classic round brick coastal lighthouse.'
        }
      ],
      codexFacts: [
        'Confederation Bridge (opened 1997) is the longest bridge in the world crossing ice-covered water.',
        'PEI’s famous red soil gets its colour from high iron oxide content that rusts on contact with air.',
        'The 1864 Charlottetown Conference laid the groundwork for Canadian Confederation in 1867.'
      ],
      href: 'province-prince-edward-island.html'
    },
    {
      id: 'manitoba',
      abbr: 'MB',
      name: 'Manitoba',
      title: 'Manitoba — The Forks & Human Rights Spire',
      capital: 'Winnipeg',
      majorCities: ['Winnipeg', 'Brandon', 'Steinbach', 'Thompson', 'Churchill'],
      highway: 'Trans-Canada Hwy 1 / Hwy 75',
      biome: 'prairie-lake',
      climate: {
        tempC: 4,
        weather: 'Clear Prairie Aurora',
        skyTop: '#081b33',
        skyHorizon: '#3c6b94',
        fogColor: '#7ea4c2',
        sunColor: '#ffefd1',
        groundColor: '#445836',
        waterColor: '#1b4b69',
        accent: '#34d399'
      },
      landmarks: [
        {
          id: 'cmhr-spire',
          name: 'Canadian Museum for Human Rights',
          coords: [0, 0, -54],
          elevationM: 100,
          description: 'Sweeping curvilinear glass cloud and 100-metre Tower of Hope rising at The Forks in Winnipeg.'
        },
        {
          id: 'the-forks',
          name: 'Red & Assiniboine Forks Confluence',
          coords: [36, 0, -24],
          elevationM: 230,
          description: '6,000-year-old Indigenous meeting place and riverfront promenade where two prairie rivers merge.'
        },
        {
          id: 'churchill-aurora-station',
          name: 'Northern Boreal Aurora Ridge',
          coords: [-64, 0, -64],
          elevationM: 45,
          description: 'Subarctic spruce-tundra horizon under the Hudson Bay auroral oval.'
        }
      ],
      codexFacts: [
        'Manitoba has over 100,000 lakes, including Lake Winnipeg—one of the largest freshwater lakes in the world.',
        'Churchill on Hudson Bay is known as the Polar Bear Capital of the World and sits directly beneath the Aurora Oval.',
        'The Forks in Winnipeg has been a crossroads for Indigenous trade and gathering for over 6,000 years.'
      ],
      href: 'province-manitoba.html'
    },
    {
      id: 'saskatchewan',
      abbr: 'SK',
      name: 'Saskatchewan',
      title: 'Saskatchewan — Living Skies & Golden Wheat Plains',
      capital: 'Regina',
      majorCities: ['Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw', 'Swift Current'],
      highway: 'Trans-Canada Hwy 1 / Yellowhead Hwy 16',
      biome: 'living-skies-wheat',
      climate: {
        tempC: 15,
        weather: 'Big Sky Golden Hour',
        skyTop: '#0d264d',
        skyHorizon: '#d49a52',
        fogColor: '#d9b583',
        sunColor: '#ffe0a3',
        groundColor: '#8d7434',
        waterColor: '#1f5a7a',
        accent: '#eab308'
      },
      landmarks: [
        {
          id: 'regina-legislative',
          name: 'Saskatchewan Legislative Building',
          coords: [0, 0, -56],
          elevationM: 53,
          description: 'Beaux-Arts Tyndall limestone dome overlooking Wascana Lake in Regina.'
        },
        {
          id: 'grain-elevators',
          name: 'Prairie Sentinel Grain Elevators',
          coords: [-54, 0, -24],
          elevationM: 32,
          description: 'Iconic timber-cribbed prairie grain elevators standing along the transcontinental rail line.'
        },
        {
          id: 'wascana-lake',
          name: 'Wascana Centre & Golden Wheatfields',
          coords: [58, 0, 26],
          elevationM: 575,
          description: 'Expansive prairie parkland and shimmering amber wheatfields under endless Living Skies.'
        }
      ],
      codexFacts: [
        'Saskatchewan has over 40% of Canada’s cultivated farmland and is a global leader in wheat, canola, and lentils.',
        'The province receives more hours of sunshine annually than any other Canadian province.',
        'Wascana Centre in Regina is one of the largest urban parks in North America at 930 hectares.'
      ],
      href: 'province-saskatchewan.html'
    },
    {
      id: 'yukon',
      abbr: 'YT',
      name: 'Yukon',
      title: 'Yukon — Klondike Gold & Mount Logan',
      capital: 'Whitehorse',
      majorCities: ['Whitehorse', 'Dawson City', 'Watson Lake', 'Haines Junction'],
      highway: 'Alaska Hwy / Klondike Hwy / Dempster Hwy',
      biome: 'klondike-glacier',
      climate: {
        tempC: -4,
        weather: 'Crisp Subarctic Alpine',
        skyTop: '#081d38',
        skyHorizon: '#5f8bb0',
        fogColor: '#9eb8cf',
        sunColor: '#fff1d4',
        groundColor: '#485446',
        waterColor: '#19506b',
        accent: '#facc15'
      },
      landmarks: [
        {
          id: 'ss-klondike',
          name: 'SS Klondike Sternwheeler',
          coords: [18, 0, -42],
          elevationM: 18,
          description: 'Restored 1937 Yukon River sternwheel paddleboat dry-docked on the Whitehorse riverfront.'
        },
        {
          id: 'dawson-boardwalk',
          name: 'Dawson City Klondike Boardwalk',
          coords: [-52, 0, 24],
          elevationM: 14,
          description: 'False-front heritage timber buildings and wooden sidewalks from the 1898 Klondike Gold Rush.'
        },
        {
          id: 'mount-logan',
          name: 'Mount Logan & Kluane Icefields',
          coords: [-64, 0, -88],
          elevationM: 5959,
          description: 'Canada’s highest peak (5,959 m) rising from the vast St. Elias non-polar icefields.'
        }
      ],
      codexFacts: [
        'Mount Logan in Kluane National Park is Canada’s highest mountain at 5,959 metres.',
        'The 1896–1899 Klondike Gold Rush brought roughly 100,000 prospectors toward Dawson City.',
        'The Dempster Highway is Canada’s only all-season highway crossing the Arctic Circle.'
      ],
      href: 'province-yukon.html'
    },
    {
      id: 'northwest-territories',
      abbr: 'NT',
      name: 'Northwest Territories',
      title: 'Northwest Territories — Great Slave Ice Road & Aurora',
      capital: 'Yellowknife',
      majorCities: ['Yellowknife', 'Hay River', 'Inuvik', 'Fort Smith', 'Behchokǫ̀'],
      highway: 'Mackenzie Hwy / Ingraham Trail / Ice Road',
      biome: 'subarctic-shield',
      climate: {
        tempC: -16,
        weather: 'Subarctic Aurora Clear',
        skyTop: '#040e1f',
        skyHorizon: '#1c4266',
        fogColor: '#284d6b',
        sunColor: '#d9ecff',
        groundColor: '#4a5560',
        waterColor: '#8db4cf',
        accent: '#2dd4bf'
      },
      landmarks: [
        {
          id: 'great-slave-ice-road',
          name: 'Great Slave Lake Ice Road',
          coords: [0, 0, -34],
          elevationM: 156,
          description: 'Engineered winter ice highway linking Yellowknife across frozen Great Slave Lake to Dettah.'
        },
        {
          id: 'diamond-headframe',
          name: 'Canadian Shield Diamond Headframe',
          coords: [-58, 0, -56],
          elevationM: 48,
          description: 'Subarctic mine headframe perched on ancient 4-billion-year-old Precambrian Shield granite.'
        },
        {
          id: 'yellowknife-aurora',
          name: 'Yellowknife Auroral Zenith',
          coords: [58, 0, -60],
          elevationM: 180,
          description: 'Curtains of emerald and violet Aurora Borealis shimmering directly overhead in the clear subarctic sky.'
        }
      ],
      codexFacts: [
        'Great Slave Lake is the deepest lake in North America at 614 metres.',
        'Yellowknife sits directly beneath the Auroral Oval, offering aurora sightings over 240 nights per year.',
        'The Acasta Gneiss in the Northwest Territories is among the oldest known intact rock on Earth (~4.03 billion years).'
      ],
      href: 'province-northwest-territories.html'
    },
    {
      id: 'nunavut',
      abbr: 'NU',
      name: 'Nunavut',
      title: 'Nunavut — Frobisher Bay, Inuksuk & High Arctic',
      capital: 'Iqaluit',
      majorCities: ['Iqaluit', 'Rankin Inlet', 'Arviat', 'Baker Lake', 'Cambridge Bay'],
      highway: 'Arctic Tundra & Sea Ice Trails',
      biome: 'arctic-tundra',
      climate: {
        tempC: -22,
        weather: 'High Arctic Diamond Dust',
        skyTop: '#030b1a',
        skyHorizon: '#1a3c5e',
        fogColor: '#365a7a',
        sunColor: '#cfe8ff',
        groundColor: '#c9d7e3',
        waterColor: '#12334d',
        accent: '#67e8f9'
      },
      landmarks: [
        {
          id: 'monumental-inuksuk',
          name: 'Iqaluit Monumental Inuksuk',
          coords: [0, 0, -50],
          elevationM: 22,
          description: 'Traditional stacked-stone Inuit directional landmark standing sentinel over Frobisher Bay.'
        },
        {
          id: 'frobisher-sea-ice',
          name: 'Frobisher Bay Sea Ice & Pack',
          coords: [56, 0, -28],
          elevationM: 0,
          description: 'Fractured Arctic sea ice plates and pressure ridges bordering Baffin Island’s tidal bay.'
        },
        {
          id: 'baffin-peaks',
          name: 'Baffin Island Fjord Peaks',
          coords: [-64, 0, -84],
          elevationM: 2100,
          description: 'Jagged glaciated granite spires of the Arctic Cordillera glowing beneath polar aurora ribbons.'
        }
      ],
      codexFacts: [
        'Created on April 1, 1999, Nunavut covers over 2 million sq km—roughly one-fifth of Canada’s total landmass.',
        'Alert on Ellesmere Island in Nunavut is the northernmost permanently inhabited place on Earth.',
        'An Inuksuk ("in the likeness of a human") serves Inuit travellers as a navigation beacon, marker, and cultural emblem.'
      ],
      href: 'province-nunavut.html'
    }
  ];

  const PROVINCES_MAP = Object.create(null);
  for (let i = 0; i < PROVINCES_LIST.length; i += 1) {
    PROVINCES_MAP[PROVINCES_LIST[i].id] = PROVINCES_LIST[i];
  }

  PROVINCES_LIST.byId = PROVINCES_MAP;
  PROVINCES_LIST.get = function getProvince(id) {
    return PROVINCES_MAP[id] || PROVINCES_MAP.ontario;
  };

  global.CANADA_PROVINCES = PROVINCES_LIST;
  global.CANADA_PROVINCES_MAP = PROVINCES_MAP;
})(typeof window !== 'undefined' ? window : globalThis);
