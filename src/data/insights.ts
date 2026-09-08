export const insightCategories = [
  'Architecture',
  'Sustainable Building',
  'Materials',
  'Construction',
  'Design',
  'Project Insights',
] as const;

export type InsightCategory = (typeof insightCategories)[number];

export const insightsPage = {
  title: 'Architectural Monograph & Insights',
  subtitle:
    'Rigorous engineering inquiries, material physics, and vernacular climatic research from the ASTHIWAR Coimbatore Atelier.',
  categories: insightCategories,
  articles: [
    {
      id: 'rammed-earth-thermal-physics',
      category: 'Sustainable Building',
      title: 'The Thermal Behavior of Rammed Earth in the Palghat Gap',
      subtitle: 'Quantifying 7.4-hour thermal phase shift in western Tamil Nadu’s microclimate',
      date: 'October 2024',
      readTime: '6 min read',
      author: 'Er. Karthik Sundaram · Structural Research Lead',
      image: {
        src: '/images/materials.jpg',
        alt: 'Layered stabilized rammed earth sample monoliths in Coimbatore atelier',
      },
      excerpt:
        'Stabilized monolithic subsoil walls delay peak ambient solar heat by 7.4 hours, dampening diurnal swings from 38°C to a stable 25°C without mechanical HVAC systems.',
      keyFindings: [
        'Volumetric heat capacity of 1,840 kJ/m³·K outperforms standard wire-cut brickwork by 34%.',
        'Stabilization with 6% hydraulic lime avoids brittle cement micro-cracking under shear.',
        'Thermal lag releases absorbed daytime heat during cool 02:00–06:00 night breezes.',
      ],
      fullEssay: [
        'Western Tamil Nadu experiences extreme diurnal temperature oscillations driven by hot dry air channelled through the Palghat mountain pass. Conventional 230mm brick and RCC assemblies exhibit thermal transit times under 3 hours, causing indoor surfaces to irradiate heat directly into living spaces precisely during peak late-afternoon occupancy.',
        'By testing subsoils excavated directly from project foundations in Pollachi and Tiruppur, our engineering team calibrated a particle-size distribution matrix: 65% coarse sand and gravel, 20% silt, and 15% reactive clay, stabilized with non-hydraulic slaked lime.',
        'Pneumatically compacted into 300mm continuous formwork, the resulting monolith provides an envelope density of 2,150 kg/m³. Field thermographic telemetry across 12 months verified that solar zenith energy absorbed at 13:00 reaches internal plaster faces at 20:30, where it is effortlessly evacuated by night-sky cross-ventilation.',
      ],
    },
    {
      id: 'slaked-lime-mortar-science',
      category: 'Materials',
      title: 'Why Slaked Lime Mortar Outlasts Portland Cement by Centuries',
      subtitle: 'The self-healing crystalline chemistry of the cyclical calcium carbonate bond',
      date: 'December 2024',
      readTime: '5 min read',
      author: 'Ar. Priya Natarajan · Principal Architect',
      image: {
        src: '/images/lime-plaster.jpg',
        alt: 'Hand-trowelled slaked lime and river sand plaster finish under grazing raking light',
      },
      excerpt:
        'Fat lime (Chunnam) breathes with humidity and re-absorbs atmospheric carbon dioxide to form crystalline limestone, actively sealing micro-fissures over multi-generational lifespans.',
      keyFindings: [
        'Low elastic modulus allows masonry to flex with seismic and thermal settlement without shear failure.',
        'Vapor-permeable crystalline lattice prevents trapped moisture rot and efflorescence.',
        'Zero calcination fossil-fuel emissions compared to rotary Portland cement kilns.',
      ],
      fullEssay: [
        'Modern construction dogma equates structural compressive strength with longevity. Yet Portland cement structures frequently deteriorate within 50 to 70 years due to rigid inflexibility, chemical moisture entrapment, and steel corrosion.',
        'Slaked lime mortar, aged for a minimum of 90 days in anaerobic water tanks at our Coimbatore facility, cures via slow atmospheric carbonation: Ca(OH)₂ + CO₂ → CaCO₃ + H₂O. As rain and humidity enter microscopic seasonal tension fractures, dissolved free calcium hydroxide migrates to the surface, recrystallizing into solid calcite that seals the fissure shut.',
        'In our Chettinad and Kongu restoration projects, lime-bedded granite foundations remain structurally pristine after 140 years of monsoon cycles, verifying that flexural compliance surpasses brute compressive hardness.',
      ],
    },
    {
      id: 'courtyard-passive-cooling',
      category: 'Architecture',
      title: 'The Courtyard Microclimate: Passive Stack Cooling in Kongu Nadu',
      subtitle: 'Deconstructing the thermodynamic geometry of the traditional Mutram',
      date: 'January 2025',
      readTime: '7 min read',
      author: 'ASTHIWAR Research Atelier',
      image: {
        src: '/images/courtyard.jpg',
        alt: 'Sunken stone water basin and open sky lightwell in an ASTHIWAR courtyard residence',
      },
      excerpt:
        'The open-sky central courtyard operates as a low-pressure thermodynamic engine. Buoyancy-driven suction constantly exhausts heated indoor air, drawing cool filtered breezes across shaded stone floors.',
      keyFindings: [
        'Stack effect generates continuous air exchange velocities between 0.8 and 1.6 m/s.',
        'Sunken courtyard water basin drops ambient ground-level dry-bulb temperature by 4.2°C.',
        'Aperture height-to-width ratio of 1:1.4 prevents solar direct penetration into habitable living zones.',
      ],
      fullEssay: [
        'The central courtyard (Mutram) in Tamil vernacular architecture is rarely a mere decorative luxury; it is a precision thermodynamic engine calibrated to solar geometry.',
        'During morning hours, the shaded courtyard floor and stone perimeter retain cool nocturnal temperatures. As the midday sun heats the upper roof planes, low-density heated air rises through the open skywell, creating a localized low-pressure chimney suction.',
        'This suction draws ambient air from shaded exterior garden verandas through perforated perimeter screens. By passing across moisture-retaining granite basins at the courtyard core, incoming breezes undergo adiabatic cooling, keeping primary living spaces comfortable without air conditioning compressors.',
      ],
    },
    {
      id: 'brutalist-concrete-jaali-screens',
      category: 'Design',
      title: 'Reconciling Brutalist Concrete with Vernacular Jaali Screens',
      subtitle: 'Balancing structural mass, aerodynamic privacy, and daylight filtering',
      date: 'March 2025',
      readTime: '5 min read',
      author: 'Ar. Priya Natarajan · Principal Architect',
      image: {
        src: '/images/jaali.jpg',
        alt: 'Perforated terracotta jaali screen casting intricate shadow geometry on concrete floor',
      },
      excerpt:
        'Perforated terracotta masonry screens modulate harsh tropical glare into dynamic geometric shadows while accelerating breezes through Venturi aperture constriction.',
      keyFindings: [
        'Venturi compression increases breeze velocity by 18% across living rooms.',
        'Direct solar irradiation reduced by 72% while preserving 100% natural daylighting.',
        'Visual acoustic privacy maintained without isolating the residence from birdsong and rain.',
      ],
      fullEssay: [
        'Tropical modernism often struggles with oversized glass curtain walls that create unliveable greenhouse heat. Conversely, heavy solid masonry creates dark, claustrophobic interiors.',
        'The terracotta jaali screen resolves this dialectic. By calculating the aperture geometry relative to Coimbatore’s solar azimuth, we position jaali screens along southwest and northwest facades.',
        'Incoming winds are compressed through narrow terracotta orifices, accelerating airflow via the Venturi principle. Simultaneously, blinding midday glare is fractured into delicate, shifting light lace across polished concrete surfaces, cultivating a serene sanctuary from urban intensity.',
      ],
    },
    {
      id: 'nilgiris-seismic-anchoring',
      category: 'Construction',
      title: 'Seismic & Hill-Slope Foundation Anchoring in the Nilgiris',
      subtitle: 'Stepped granite plinths and drainage engineering for 2,200m elevations',
      date: 'April 2025',
      readTime: '6 min read',
      author: 'Er. Karthik Sundaram · Structural Research Lead',
      image: {
        src: '/images/asthivar-villa.jpg',
        alt: 'Stepped granite foundation plinth anchored into natural mountain slope terrain',
      },
      excerpt:
        'Building on sensitive Western Ghats topography requires zero-cut-and-fill foundation designs. Stepped stone gabions and subsurface French weep drains protect hillside integrity against torrential monsoon runoff.',
      keyFindings: [
        'Stepped foundation piers avoid destabilizing fragile high-altitude mountain slopes.',
        'Gravity-fed French drain networks divert 100% of hillside hydraulic head away from basements.',
        'Basalt stone joinery bound with lime-pozzolana composite resists freeze-thaw degradation.',
      ],
      fullEssay: [
        'Conventional hill construction in Ooty and Coonoor relies on bulldozing sheer cuts into tea-garden hillsides, creating devastating landslides during monsoon cloudbursts.',
        'ASTHIWAR utilizes an elevated stepped pier system. Individual reinforced granite pylons touch the terrain only at precise geological load-bearing granite outcrops, preserving root networks and natural slope contours.',
        'Subsurface drainage galleries lined with porous river shingle channel hydraulic pressure away from the foundation footprint, ensuring structural permanence against intense tropical hill deluges.',
      ],
    },
    {
      id: 'athangudi-tile-heritage-joinery',
      category: 'Project Insights',
      title: 'The Living Alchemy of Hand-Pressed Athangudi Tile Joinery',
      subtitle: 'Sourcing river sands and mineral pigments for Chettinad heritage floors',
      date: 'May 2025',
      readTime: '4 min read',
      author: 'ASTHIWAR Craft Guild',
      image: {
        src: '/images/sustainable.jpg',
        alt: 'Hand-crafted mineral pigment Athangudi tiles curing on glass casting sheets',
      },
      excerpt:
        'Crafted on smooth glass sheets without kiln firing, Athangudi tiles cure through water-immersion for 21 days, yielding silky mirror-finish floors that patina with decades of bare-foot polishing.',
      keyFindings: [
        'Zero electrical or kiln energy consumed during tile manufacturing.',
        'Natural mineral oxides remain vibrant for over 100 years without chemical sealants.',
        'Provides a cool, tactile thermal contact surface for hot tropical summer months.',
      ],
      fullEssay: [
        'In our Chettinad and ancestral estate commissions, flooring is treated not as a commodified spec, but as an heirloom sensory canvas.',
        'Athangudi tiles are hand-poured in the Sivagangai district using local river sand, white cement, and pure mineral metal oxides poured into intricate brass stencils resting on sheets of thick float glass.',
        'After setting, each tile is submerged in water curing vats for three weeks. The glass surface produces a glass-smooth polish that requires no wax, diamond-grinding, or synthetic sealers. Over decades of living, daily barefoot contact and rice-water mopping polish the floor to a lustrous satin sheen that synthetic vitrified tiles can never replicate.',
      ],
    },
  ],
} as const;

export type Article = (typeof insightsPage.articles)[number];
