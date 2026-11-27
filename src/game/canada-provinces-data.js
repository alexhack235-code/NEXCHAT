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
          coords: [0, 0, -85],
          elevationM: 553,
          description: '553.3 m post-tensioned slip-formed concrete telecommunications and observation spire anchoring the Toronto skyline over Lake Ontario.'
        },
        {
          id: 'rogers-centre',
          name: 'Rogers Harbour Dome',
          coords: [-56, 0, -165],
          elevationM: 86,
          description: 'Iconic multi-purpose stadium featuring the world’s first fully retractable motorized four-panel roof along the Union Station railway corridor.'
        },
        {
          id: 'niagara-falls',
          name: 'Niagara Horseshoe Falls',
          coords: [95, 0, 310],
          elevationM: 51,
          description: 'Thundering emerald-white Horseshoe Falls plunging 51 metres into the Niagara Gorge along the scenic Niagara Parkway with constant billowing mist plumes.'
        }
      ],
      codexFacts: [
        'Highway 401 (Macdonald-Cartier Freeway) is North America’s busiest highway corridor, carrying up to 500,000 vehicles daily through the Greater Toronto Area.',
        'North of Georgian Bay, Highway 69 and the Trans-Canada Highway cut directly through billions-of-years-old pink granite and gneiss Canadian Shield rock cuts.',
        'Completed in 1976 by Canadian National, the 553.3 m CN Tower held the record as the world’s tallest free-standing structure for over three decades.'
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
          coords: [0, 10, -90],
          elevationM: 80,
          description: 'Grand Chateauesque railway palace with steep verdigris copper roofs and stone turrets crowning Cap Diamant high above Old Québec and the St. Lawrence River.'
        },
        {
          id: 'st-lawrence-port',
          name: 'St. Lawrence Riverfront & Citadel',
          coords: [75, 0, -185],
          elevationM: 35,
          description: 'Historic fortified stone citadel promontory and deep-water maritime port along the St. Lawrence Seaway corridor connecting the Great Lakes to the Atlantic.'
        },
        {
          id: 'montreal-olympic-tower',
          name: 'Montréal Inclined Tower',
          coords: [-88, 0, 315],
          elevationM: 165,
          description: 'World’s tallest inclined structure at 165 metres and 45 degrees, soaring over Hochelaga-Maisonneuve and the St. Lawrence bridge network.'
        }
      ],
      codexFacts: [
        'Québec City is the only preserved fortified walled city north of Mexico, safeguarded by 4.6 km of historic ramparts and the Citadelle atop Cap Diamant.',
        'Autoroute 20 and Autoroute 40 flank the historic St. Lawrence River valley, traversing centuries-old French seigneurial agricultural strip farms.',
        'The Pont de Québec across the St. Lawrence River has the longest cantilever bridge span in the world at 549 metres.'
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
          coords: [-22, 0, -95],
          elevationM: 42,
          description: 'Five iconic Teflon-coated fiberglass architectural sails jutting into Burrard Inlet at Vancouver’s vibrant Pacific harbour terminus.'
        },
        {
          id: 'lions-gate-bridge',
          name: 'Lions Gate Suspension Bridge',
          coords: [78, 0, -195],
          elevationM: 111,
          description: 'Emerald-green art deco three-lane suspension bridge spanning First Narrows between Stanley Park and the North Shore Coast Mountains.'
        },
        {
          id: 'coast-mountains-fjord',
          name: 'Coast Mountains & Howe Sound',
          coords: [-95, 0, 320],
          elevationM: 1850,
          description: 'Glaciated granite peaks and cascading waterfalls along the Sea-to-Sky Highway corridor where the Coast Mountains plunge sheer into deep Pacific fjord waters.'
        }
      ],
      codexFacts: [
        'The Sea-to-Sky Highway (BC Hwy 99) climbs 670 metres from sea-level Howe Sound fjords to alpine Whistler, flanked by sheer granite cliffs and engineered rock sheds.',
        'Rogers Pass on Trans-Canada Highway 1 features heavy reinforced-concrete avalanche snowsheds and active artillery fire control to maintain winter corridor safety.',
        'Lions Gate Bridge opened in 1938 and links downtown Vancouver to the Pacific Coast Mountains via a historic 472-metre main suspension span.'
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
          coords: [0, 0, -90],
          elevationM: 191,
          description: '191-metre observation spire and flame cauldron overlooking the Bow River Valley and corporate towers of downtown Calgary.'
        },
        {
          id: 'banff-rockies',
          name: 'Banff Rundle & Cascade Massif',
          coords: [-92, 0, -320],
          elevationM: 2948,
          description: 'Massive tilted limestone and dolomite strata of Mount Rundle and Cascade Mountain framing Trans-Canada Highway 1 through Bow Valley.'
        },
        {
          id: 'lake-louise',
          name: 'Lake Louise Glacial Basin',
          coords: [85, 0, 220],
          elevationM: 1750,
          description: 'Turquoise rock-flour glacial lake cradled beneath Mount Victoria and the historic Fairmont Chateau Lake Louise along the Continental Divide.'
        }
      ],
      codexFacts: [
        'Trans-Canada Highway 1 through Banff National Park pioneered world-famous landscaped wildlife overpasses and underpasses, reducing animal collisions by over 80%.',
        'Highway 93 North (Icefields Parkway) weaves 232 km across the spine of the Canadian Rockies past the Columbia Icefield and Athabasca Glacier.',
        'Warm Chinook winds descending from the Rockies can raise southern Alberta highway temperatures by 20 °C in mere hours.'
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
          coords: [0, 0, -90],
          elevationM: 92,
          description: 'High Victorian Gothic Revival Centre Block on Parliament Hill crowned by the 92.2 m Peace Tower, Memorial Chamber, and patinated copper roofs.'
        },
        {
          id: 'rideau-canal',
          name: 'Rideau Canal Locks',
          coords: [58, 0, -175],
          elevationM: 60,
          description: 'UNESCO World Heritage 202-km stone canal and lockstation corridor winding past Château Laurier, transforming in winter into the 7.8 km Rideau Canal Skateway.'
        },
        {
          id: 'alexandra-bridge',
          name: 'Alexandra Interprovincial Bridge',
          coords: [-74, 0, 305],
          elevationM: 45,
          description: 'Historic 1901 cantilever steel truss bridge spanning the Ottawa River between Ottawa, Ontario and Gatineau, Quebec with scenic boardwalk views of Parliament Hill.'
        }
      ],
      codexFacts: [
        'Completed in 1832 under Lt.-Col. John By, the Rideau Canal is North America’s oldest continuously operated slackwater canal system.',
        'Highway 417 (The Queensway) serves as the primary east-west freeway spine through Ottawa, connecting high-tech Silicon Valley North in Kanata.',
        'The Peace Tower carillon houses 53 tuned bronze bells weighing up to 10 tonnes, commemorating Canadian service in World War I.'
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
          coords: [0, 4, -95],
          elevationM: 15,
          description: 'Iconic 1915 reinforced concrete octagonal beacon perched on glacially scoured Devonian granite boulders at the entrance to St. Margarets Bay.'
        },
        {
          id: 'granite-headland',
          name: 'Peggy’s Cove Granite Batholith',
          coords: [-52, 0, -185],
          elevationM: 12,
          description: 'Smooth, wave-swept South Mountain Batholith granite ledges meeting the relentless North Atlantic ocean swells along the scenic Lighthouse Route.'
        },
        {
          id: 'halifax-harbour-pier',
          name: 'Halifax Harbour & Pier 21',
          coords: [90, 0, 315],
          elevationM: 8,
          description: 'Historic naval dockyards and Pier 21 immigration gateway guarding one of the world’s deepest ice-free natural harbours beneath Citadel Hill.'
        }
      ],
      codexFacts: [
        'Peggy’s Point Lighthouse sits atop the 370-million-year-old South Mountain Batholith, weathered smooth by ancient Pleistocene glaciers.',
        'Cape Breton’s world-renowned Cabot Trail highway climbs over 450-metre coastal plateaus with hair-raising switchbacks above the Gulf of St. Lawrence.',
        'Pier 21 in Halifax was the port of entry for over 1.5 million immigrants, refugees, and returning wartime troops between 1928 and 1971.'
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
          coords: [0, 12, -95],
          elevationM: 150,
          description: 'Gothic revival red sandstone fortification crowning Signal Hill where Guglielmo Marconi received the world’s first transatlantic wireless signal in 1901.'
        },
        {
          id: 'jellybean-row',
          name: 'Jellybean Row Heritage Terrace',
          coords: [-68, 0, -195],
          elevationM: 25,
          description: 'Steep downtown St. John’s heritage clapboard rowhouses painted in vibrant crimson, gold, cobalt, and emerald to pierce the dense North Atlantic fog.'
        },
        {
          id: 'iceberg-alley',
          name: 'Iceberg Alley Tabular Bergs',
          coords: [88, 0, 320],
          elevationM: 45,
          description: '10,000-year-old glacial tabular icebergs drifting south from Greenland along the cold Labrador Current past Cape Spear.'
        }
      ],
      codexFacts: [
        'Mile One of the 7,821-km Trans-Canada Highway begins in St. John’s, traversing 905 km of rugged Newfoundland wilderness to Port aux Basques.',
        'Signal Hill at the entrance to St. John’s Harbour was the site of the pivotal final battle of the Seven Years’ War in North America in 1762.',
        'St. John’s Jellybean Row houses feature traditional clapboard siding, heavy wooden storm doors, and ornate trim engineered to endure harsh Atlantic blizzards.'
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
          coords: [0, 0, -88],
          elevationM: 21,
          description: 'Red sandstone flowerpot rock sea stacks sculpted by the world’s highest tides and crowned with hardy spruce trees along Shepody Bay.'
        },
        {
          id: 'fundy-cliffs',
          name: 'Bay of Fundy Red Cliffs',
          coords: [-75, 0, -190],
          elevationM: 32,
          description: 'Towering Carboniferous red conglomerate coastal cliffs along Route 114 undergoing 16-metre semi-diurnal tidal fluctuations twice each day.'
        },
        {
          id: 'reversing-falls-bridge',
          name: 'Saint John Harbour Span',
          coords: [84, 0, 310],
          elevationM: 40,
          description: 'Steel highway and railway through-arch bridges spanning the rocky gorge where massive Bay of Fundy high tides force the Saint John River to reverse its flow.'
        }
      ],
      codexFacts: [
        'The Bay of Fundy moves 160 billion tonnes of seawater each 12-hour tide cycle—exceeding the combined flow of all freshwater rivers on Earth.',
        'Hartland Covered Bridge in western New Brunswick is the world’s longest wooden covered bridge, spanning 391 metres across the Saint John River.',
        'New Brunswick is Canada’s only constitutionally bilingual province, with the Trans-Canada Hwy 2 corridor connecting Acadian and English heritage communities.'
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
          coords: [24, 0, -110],
          elevationM: 60,
          description: '12.9-km post-tensioned curved concrete box-girder bridge spanning the Abegweit Passage with conical ice shields to fracture winter drift ice.'
        },
        {
          id: 'green-gables',
          name: 'Green Gables Heritage House',
          coords: [-68, 0, 195],
          elevationM: 12,
          description: '19th-century white farmhouse with dark-green gables in Cavendish that inspired L.M. Montgomery’s timeless novel Anne of Green Gables.'
        },
        {
          id: 'point-prim-lighthouse',
          name: 'Red Sandstone Cliffs & Lighthouse',
          coords: [-85, 0, -315],
          elevationM: 18,
          description: 'Historic 1845 circular brick lighthouse standing sentinel atop the iron-rich rust-red Permian sandstone bluffs of Hillsborough Bay.'
        }
      ],
      codexFacts: [
        'Opened in 1997, Confederation Bridge is the world’s longest continuous bridge spanning ice-covered marine waters, linking Borden-Carleton to New Brunswick.',
        'PEI’s rolling agricultural soil and coastal cliffs get their striking red coloration from high iron oxide content oxidized over 300 million years.',
        'The 1864 Charlottetown Conference held at Province House laid the founding blueprint for the Dominion of Canada.'
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
          coords: [0, 0, -90],
          elevationM: 100,
          description: 'Sweeping Antoine Predock curved glass cloud facade and 100-metre Tower of Hope spire anchoring The Forks in Winnipeg.'
        },
        {
          id: 'the-forks',
          name: 'Red & Assiniboine Forks Confluence',
          coords: [56, 0, 175],
          elevationM: 230,
          description: '6,000-year-old Indigenous trade and ceremonial gathering site at the scenic confluence of the Red and Assiniboine rivers.'
        },
        {
          id: 'churchill-aurora-station',
          name: 'Northern Boreal Aurora Ridge',
          coords: [-90, 0, -320],
          elevationM: 45,
          description: 'Subarctic boreal research ridge and Hudson Bay tundra outpost positioned directly under the primary northern auroral oval.'
        }
      ],
      codexFacts: [
        'Trans-Canada Highway 1 passes the Longitudinal Centre of Canada (96° 48’ 35” W) just east of Winnipeg, marking the halfway point between oceans.',
        'Churchill on Hudson Bay is recognized as the Polar Bear Capital of the World and one of the globe’s best locations for Aurora Borealis viewings.',
        'The Forks in Winnipeg has served as an essential seasonal crossroads for First Nations and Métis trade for over six millennia.'
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
          coords: [0, 0, -90],
          elevationM: 53,
          description: 'Grand Beaux-Arts legislative dome clad in native Manitoba Tyndall limestone, overlooking Wascana Centre gardens in Regina.'
        },
        {
          id: 'grain-elevators',
          name: 'Prairie Sentinel Grain Elevators',
          coords: [-75, 0, -210],
          elevationM: 32,
          description: 'Iconic timber-cribbed "Prairies sentinels" painted in CPR and wheat pool heritage liveries standing along the transcontinental railway line.'
        },
        {
          id: 'wascana-lake',
          name: 'Wascana Centre & Golden Wheatfields',
          coords: [85, 0, 315],
          elevationM: 575,
          description: 'Expansive 930-hectare urban parkland basin and golden wheatfield horizons stretching beneath Saskatchewan’s legendary Living Skies.'
        }
      ],
      codexFacts: [
        'Historic timber-cribbed prairie grain elevators were engineered with interlocking 2x4 spruce planks to withstand thousands of tons of outward grain pressure.',
        'Saskatchewan contains over 40% of Canada’s total cultivated farmland, serving as a global agricultural powerhouse for wheat, canola, and pulses.',
        'The Yellowhead Highway (Hwy 16) and Trans-Canada Hwy 1 span vast post-glacial plains and scenic coulees under more annual sunshine than any other Canadian province.'
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
          coords: [20, 0, -90],
          elevationM: 18,
          description: 'Restored 1937 British Yukon Navigation Co. sternwheel steam paddleboat dry-docked on the Yukon River embankment in Whitehorse.'
        },
        {
          id: 'dawson-boardwalk',
          name: 'Dawson City Klondike Boardwalk',
          coords: [-70, 0, 195],
          elevationM: 14,
          description: 'Preserved 1898 gold rush false-front timber architecture and raised boardwalks along Front Street in Dawson City.'
        },
        {
          id: 'mount-logan',
          name: 'Mount Logan & Kluane Icefields',
          coords: [-105, 0, -320],
          elevationM: 5959,
          description: 'Canada’s highest mountain summit (5,959 m) rising from the monumental sub-polar glaciers of Kluane National Park.'
        }
      ],
      codexFacts: [
        'The Alaska Highway was surveyed and pushed through 2,232 km of subarctic muskeg, mountains, and permafrost in only eight months in 1942.',
        'The Dempster Highway (Yukon Hwy 5) is Canada’s premier all-season gravel roadway crossing the Arctic Circle to the Mackenzie Delta and Arctic Ocean.',
        'Mount Logan in Kluane National Park features eleven distinct peaks exceeding 5,000 metres and the largest base circumference of any non-volcanic peak on Earth.'
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
          coords: [0, 0, -88],
          elevationM: 156,
          description: 'Engineered winter ice freeway plowed 1.5 metres deep across the crystal-clear frozen surface of Great Slave Lake connecting Yellowknife to Dettah.'
        },
        {
          id: 'diamond-headframe',
          name: 'Canadian Shield Diamond Headframe',
          coords: [-78, 0, -195],
          elevationM: 48,
          description: 'Subarctic mine exploration headframe anchored directly into billions-of-years-old Precambrian Canadian Shield granite.'
        },
        {
          id: 'yellowknife-aurora',
          name: 'Yellowknife Auroral Zenith',
          coords: [84, 0, 315],
          elevationM: 180,
          description: 'Vibrant curtains of dancing emerald and violet Aurora Borealis illuminating the subarctic night sky above the Canadian Shield.'
        }
      ],
      codexFacts: [
        'The Tibbitt to Contwoyto Winter Road is the world’s longest heavy-haul ice road, engineered across frozen subarctic lakes to service remote diamond mines.',
        'Great Slave Lake is the deepest body of water in North America at 614 metres, feeding the vast 1,738 km Mackenzie River corridor.',
        'Yellowknife’s northern latitude and inland shield climate create optimal viewing for the Northern Lights on more than 240 nights each year.'
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
          coords: [0, 0, -90],
          elevationM: 22,
          description: 'Traditional stacked-granite Inuit directional marker and cultural sentinel overlooking the tidal shoreline of Koojesse Inlet in Iqaluit.'
        },
        {
          id: 'frobisher-sea-ice',
          name: 'Frobisher Bay Sea Ice & Pack',
          coords: [78, 0, 195],
          elevationM: 0,
          description: 'Dynamic frozen sea ice plateaus, tidal cracks, and pressure ridges extending across Frobisher Bay and Davis Strait.'
        },
        {
          id: 'baffin-peaks',
          name: 'Baffin Island Fjord Peaks',
          coords: [-95, 0, -320],
          elevationM: 2100,
          description: 'Sheer glaciated granite towers and deep Arctic fjords of Baffin Island glowing beneath polar twilight.'
        }
      ],
      codexFacts: [
        'An Inuksuk (plural: Inuksuit) is constructed from unshaped tundra stone to serve as navigation guides, hunting markers, and sacred cultural beacons across the Arctic.',
        'Nunavut spans roughly 2.09 million square kilometres—one-fifth of Canada’s total area—with communities linked entirely by air, sea, and winter sea ice travel.',
        'The Legislative Assembly building in Iqaluit reflects Inuit traditions, featuring a woven seal-skin chamber and an official mace carved from narwhal tusk and caribou antler.'
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
