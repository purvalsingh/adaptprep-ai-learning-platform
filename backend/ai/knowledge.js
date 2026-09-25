// Curated concept notes used by the local AI tutor. Each entry is short,
// exam-focused, and mapped to the topics used in the question bank so the
// tutor can connect explanations to practice.

const KNOWLEDGE = [
    // ---------------- Physics ----------------
    {
        id: 'newton-laws', subject: 'physics', topic: 'Mechanics', title: "Newton's Laws of Motion",
        keywords: ['newton', 'force', 'inertia', 'acceleration', 'f=ma', 'action reaction', 'momentum', 'friction'],
        summary: "1st law: a body stays at rest or in uniform motion unless a net external force acts (inertia). 2nd law: net force equals rate of change of momentum, F = dp/dt = ma for constant mass. 3rd law: every action has an equal and opposite reaction acting on a *different* body.",
        formulas: ['F = ma', 'p = mv', 'Impulse J = FΔt = Δp', 'Friction f ≤ μN'],
        tips: ['Always draw a free-body diagram first and list every force on ONE body.', 'Action–reaction pairs never cancel because they act on different bodies.']
    },
    {
        id: 'work-energy', subject: 'physics', topic: 'Work and Energy', title: 'Work, Energy and Power',
        keywords: ['work', 'energy', 'kinetic', 'potential', 'power', 'work energy theorem', 'conservation of energy', 'joule'],
        summary: 'Work W = F·d·cosθ. The work–energy theorem says net work equals change in kinetic energy. Mechanical energy (KE + PE) is conserved when only conservative forces act. Power is the rate of doing work.',
        formulas: ['KE = ½mv²', 'PE (gravity) = mgh', 'PE (spring) = ½kx²', 'W_net = ΔKE', 'P = W/t = F·v'],
        tips: ['If a question mentions "smooth" or "frictionless", conserve mechanical energy.', 'Doubling speed quadruples kinetic energy.']
    },
    {
        id: 'kinematics', subject: 'physics', topic: 'Kinematics', title: 'Kinematics (Equations of Motion)',
        keywords: ['velocity', 'displacement', 'kinematics', 'equations of motion', 'uniform acceleration', 'free fall', 'speed'],
        summary: 'For constant acceleration, the three SUVAT equations relate displacement, initial and final velocity, acceleration and time. Displacement is a vector (shortest path); distance is the path length.',
        formulas: ['v = u + at', 's = ut + ½at²', 'v² = u² + 2as', 'sₙ (nth second) = u + a(2n − 1)/2'],
        tips: ['Choose a sign convention (e.g. up = +) and stick to it.', 'Free fall: a = g ≈ 9.8 m/s² (often 10 in exams).']
    },
    {
        id: 'projectile', subject: 'physics', topic: 'Projectile Motion', title: 'Projectile Motion',
        keywords: ['projectile', 'range', 'trajectory', 'maximum height', 'time of flight', 'angle of projection'],
        summary: 'A projectile has constant horizontal velocity (u cosθ) and uniformly accelerated vertical motion (−g). The path is a parabola. Range is maximum at 45°, and complementary angles (θ and 90° − θ) give the same range.',
        formulas: ['R = u² sin2θ / g', 'H = u² sin²θ / 2g', 'T = 2u sinθ / g', 'R_max = u²/g (at 45°)'],
        tips: ['Treat horizontal and vertical motion independently.', 'At the top, vertical velocity is zero but horizontal velocity is not.']
    },
    {
        id: 'circular-motion', subject: 'physics', topic: 'Circular Motion', title: 'Circular Motion',
        keywords: ['circular', 'centripetal', 'angular velocity', 'radius', 'revolution', 'banking'],
        summary: 'In uniform circular motion speed is constant but velocity changes direction, so there is a centripetal acceleration towards the centre. The required centripetal force is provided by tension, friction, gravity, normal force, etc.',
        formulas: ['a_c = v²/r = ω²r', 'F_c = mv²/r', 'v = ωr', 'T = 2π/ω'],
        tips: ['Centripetal force is not a new force — identify which real force provides it.', 'After half a revolution, displacement = diameter (2r).']
    },
    {
        id: 'gravitation', subject: 'physics', topic: 'Gravitation', title: 'Gravitation',
        keywords: ['gravitation', 'gravity', 'orbital', 'escape velocity', 'satellite', 'kepler', 'g at height'],
        summary: "Newton's law of gravitation: every two masses attract with F = Gm₁m₂/r². Satellites orbit when gravity supplies the centripetal force. Escape velocity is independent of the mass of the escaping body.",
        formulas: ['F = Gm₁m₂/r²', 'g = GM/R²', 'v_orbit = √(GM/r)', 'v_escape = √(2GM/R) = √(2gR) ≈ 11.2 km/s', "Kepler's 3rd law: T² ∝ r³"],
        tips: ['v_escape = √2 × v_orbit (near the surface).', 'g decreases both above and below Earth\'s surface.']
    },
    {
        id: 'shm', subject: 'physics', topic: 'Simple Harmonic Motion', title: 'Simple Harmonic Motion',
        keywords: ['shm', 'oscillation', 'pendulum', 'spring', 'harmonic', 'time period', 'amplitude'],
        summary: 'SHM occurs when the restoring force is proportional to displacement and opposite in direction (F = −kx). Energy continuously exchanges between kinetic and potential while the total stays constant.',
        formulas: ['T (spring) = 2π√(m/k)', 'T (pendulum) = 2π√(L/g)', 'x = A sin(ωt + φ)', 'v_max = Aω', 'E = ½kA²'],
        tips: ['Pendulum period does not depend on mass or (small) amplitude.', 'Speed is maximum at the mean position, acceleration is maximum at the extremes.']
    },
    {
        id: 'thermodynamics', subject: 'physics', topic: 'Thermodynamics', title: 'Thermodynamics',
        keywords: ['thermodynamics', 'heat', 'internal energy', 'first law', 'isothermal', 'adiabatic', 'carnot', 'entropy', 'efficiency'],
        summary: 'First law: ΔU = Q − W (heat added minus work done by the gas). Isothermal: ΔU = 0. Adiabatic: Q = 0. The Carnot engine sets the maximum efficiency between two temperatures.',
        formulas: ['ΔU = Q − W', 'W (isothermal) = nRT ln(V₂/V₁)', 'PV^γ = constant (adiabatic)', 'η_Carnot = 1 − T_c/T_h (Kelvin)'],
        tips: ['Always convert temperatures to kelvin in efficiency problems.', 'Check the sign convention your textbook uses for W.']
    },
    {
        id: 'electrostatics', subject: 'physics', topic: 'Electrostatics', title: 'Electrostatics',
        keywords: ['charge', 'coulomb', 'electric field', 'potential', 'capacitor', 'gauss', 'dipole', 'capacitance'],
        summary: "Coulomb's law gives the force between point charges. Electric field is force per unit charge; potential is work per unit charge. Gauss's law relates flux through a closed surface to enclosed charge.",
        formulas: ['F = kq₁q₂/r², k = 9×10⁹ N·m²/C²', 'E = kq/r²', 'V = kq/r', 'C = ε₀A/d', 'U = ½CV²', 'Φ = q_enc/ε₀'],
        tips: ['Field inside a conductor is zero in electrostatic equilibrium.', 'Capacitors in series add like resistors in parallel.']
    },
    {
        id: 'current-electricity', subject: 'physics', topic: 'Electricity', title: 'Current Electricity',
        keywords: ['current', 'resistance', 'ohm', 'voltage', 'kirchhoff', 'resistor', 'circuit', 'emf', 'power dissipation'],
        summary: "Ohm's law V = IR. Resistors in series add; in parallel their reciprocals add. Kirchhoff's current law conserves charge at junctions; the voltage law conserves energy around loops.",
        formulas: ['V = IR', 'R = ρL/A', 'Series: R = R₁ + R₂', 'Parallel: 1/R = 1/R₁ + 1/R₂', 'P = VI = I²R = V²/R'],
        tips: ['Stretching a wire n times its length makes resistance n² times.', 'Identical resistors in parallel: R_eq = R/n.']
    },
    {
        id: 'magnetism', subject: 'physics', topic: 'Magnetism', title: 'Magnetism and EMI',
        keywords: ['magnetic', 'lorentz', 'solenoid', 'induction', 'faraday', 'lenz', 'flux', 'biot'],
        summary: "A moving charge in a magnetic field feels F = qvB sinθ. Changing magnetic flux induces an EMF (Faraday's law), and Lenz's law says the induced current opposes the change that caused it.",
        formulas: ['F = qvB sinθ', 'r = mv/qB', 'B (solenoid) = μ₀nI', 'EMF = −dΦ/dt', 'Φ = BA cosθ'],
        tips: ['Magnetic force does no work — it changes direction, not speed.', 'Use the right-hand rule carefully for direction.']
    },
    {
        id: 'optics', subject: 'physics', topic: 'Optics', title: 'Ray Optics',
        keywords: ['lens', 'mirror', 'refraction', 'reflection', 'focal length', 'snell', 'total internal reflection', 'magnification', 'optics'],
        summary: "Mirrors and lenses form images according to the mirror/lens formulas. Snell's law governs refraction. Total internal reflection happens when light goes from denser to rarer medium beyond the critical angle.",
        formulas: ['Mirror: 1/f = 1/v + 1/u', 'Lens: 1/f = 1/v − 1/u', 'n₁ sinθ₁ = n₂ sinθ₂', 'sin C = 1/n', 'Power P = 1/f (m) in dioptres'],
        tips: ['Use the Cartesian sign convention consistently.', 'For a concave mirror, f = R/2.']
    },
    {
        id: 'waves', subject: 'physics', topic: 'Waves', title: 'Waves and Sound',
        keywords: ['wave', 'frequency', 'wavelength', 'sound', 'doppler', 'resonance', 'standing wave', 'beats'],
        summary: 'Wave speed equals frequency times wavelength. Standing waves form from superposition of waves travelling in opposite directions. The Doppler effect shifts observed frequency when source or observer move.',
        formulas: ['v = fλ', 'Beats = |f₁ − f₂|', 'String: f = (n/2L)√(T/μ)', "Doppler: f' = f (v ± v_o)/(v ∓ v_s)"],
        tips: ['Open pipe: all harmonics. Closed pipe: only odd harmonics.', 'Sound speed in air ≈ 330–343 m/s.']
    },
    {
        id: 'modern-physics', subject: 'physics', topic: 'Modern Physics', title: 'Modern Physics',
        keywords: ['photoelectric', 'photon', 'de broglie', 'bohr', 'work function', 'quantum', 'wavelength of electron'],
        summary: "Light behaves as photons with energy E = hf. In the photoelectric effect, electrons are emitted only if photon energy exceeds the work function; intensity changes the number of electrons, not their maximum energy. Matter has wavelength λ = h/p.",
        formulas: ['E = hf = hc/λ', 'K_max = hf − φ', 'λ = h/p = h/mv', 'Bohr: E_n = −13.6/n² eV (hydrogen)'],
        tips: ['hc ≈ 1240 eV·nm is a quick shortcut for photon energy.', 'Stopping potential depends on frequency, not intensity.']
    },
    {
        id: 'nuclear', subject: 'physics', topic: 'Nuclear Physics', title: 'Nuclear Physics and Radioactivity',
        keywords: ['nuclear', 'radioactive', 'half life', 'decay', 'binding energy', 'fission', 'fusion', 'alpha', 'beta', 'gamma'],
        summary: 'Radioactive decay is random but follows N = N₀e^(−λt). Half-life is the time for half the nuclei to decay. Binding energy per nucleon peaks near iron-56, which is why fission of heavy nuclei and fusion of light nuclei both release energy.',
        formulas: ['N = N₀ e^(−λt)', 't½ = 0.693/λ', 'After n half-lives: N = N₀/2ⁿ', 'E = Δm c² (1 u ≈ 931.5 MeV)'],
        tips: ['Alpha decay: A − 4, Z − 2. Beta-minus: Z + 1, A unchanged.']
    },
    {
        id: 'units-dimensions', subject: 'physics', topic: 'Units and Dimensions', title: 'Units and Dimensions',
        keywords: ['dimension', 'dimensional', 'unit', 'si unit', 'dimensional analysis'],
        summary: 'Every physical quantity can be written in terms of base dimensions M, L, T (plus A, K, mol, cd). Dimensional analysis checks equations and derives relations, but cannot find dimensionless constants.',
        formulas: ['Force [MLT⁻²]', 'Energy [ML²T⁻²]', 'Power [ML²T⁻³]', 'Pressure [ML⁻¹T⁻²]', 'G [M⁻¹L³T⁻²]'],
        tips: ['Only quantities with the same dimensions can be added or equated.']
    },

    // ---------------- Chemistry ----------------
    {
        id: 'mole-concept', subject: 'chemistry', topic: 'Stoichiometry', title: 'Mole Concept and Stoichiometry',
        keywords: ['mole', 'avogadro', 'molar mass', 'stoichiometry', 'limiting reagent', 'molarity', 'molality', 'concentration'],
        summary: 'One mole contains 6.022×10²³ particles. Moles link mass, particle count and gas volume. Balanced equations give mole ratios; the limiting reagent is the one that runs out first.',
        formulas: ['n = mass / molar mass', 'Molarity M = n / V(L)', 'Molality m = n / mass of solvent (kg)', '1 mol gas at STP ≈ 22.4 L'],
        tips: ['Convert everything to moles before using the equation ratio.', 'Molality is temperature independent; molarity is not.']
    },
    {
        id: 'atomic-structure', subject: 'chemistry', topic: 'Atomic Structure', title: 'Atomic Structure',
        keywords: ['atom', 'electron', 'orbital', 'quantum number', 'aufbau', 'hund', 'pauli', 'electronic configuration', 'shell'],
        summary: "Electrons occupy orbitals described by four quantum numbers (n, l, mₗ, mₛ). Filling follows the Aufbau principle (n + l rule), Pauli's exclusion principle and Hund's rule of maximum multiplicity.",
        formulas: ['Max electrons in shell = 2n²', 'Orbitals in subshell = 2l + 1', 'Angular nodes = l, radial nodes = n − l − 1'],
        tips: ['Cr and Cu are exceptions: 3d⁵4s¹ and 3d¹⁰4s¹ (half/fully filled stability).']
    },
    {
        id: 'periodic-trends', subject: 'chemistry', topic: 'Periodic Trends', title: 'Periodic Trends',
        keywords: ['periodic', 'ionization', 'electronegativity', 'atomic radius', 'electron affinity', 'trend', 'group', 'period'],
        summary: 'Across a period, effective nuclear charge rises: atomic radius falls, ionisation energy and electronegativity rise. Down a group, radius increases and ionisation energy falls.',
        formulas: [],
        tips: ['Fluorine is the most electronegative element; chlorine has the highest electron affinity.', 'N > O in first ionisation energy (half-filled p-subshell).']
    },
    {
        id: 'chemical-bonding', subject: 'chemistry', topic: 'Chemical Bonding', title: 'Chemical Bonding and Molecular Structure',
        keywords: ['bond', 'hybridization', 'hybridisation', 'vsepr', 'shape', 'ionic', 'covalent', 'sigma', 'pi', 'molecular orbital', 'bond order', 'polarity'],
        summary: 'VSEPR predicts shape from electron pairs around the central atom. Hybridisation (sp, sp², sp³, sp³d, sp³d²) explains geometry. MO theory gives bond order = (bonding − antibonding)/2 and explains magnetism (O₂ is paramagnetic).',
        formulas: ['Bond order = (N_b − N_a)/2', 'Steric number = bonded atoms + lone pairs'],
        tips: ['Lone pairs repel more than bond pairs, shrinking bond angles (CH₄ 109.5° > NH₃ 107° > H₂O 104.5°).']
    },
    {
        id: 'thermochemistry', subject: 'chemistry', topic: 'Thermochemistry', title: 'Chemical Thermodynamics',
        keywords: ['enthalpy', 'entropy', 'gibbs', 'spontaneous', 'hess', 'exothermic', 'endothermic', 'thermochemistry'],
        summary: "Enthalpy change ΔH measures heat at constant pressure. A process is spontaneous when ΔG < 0. Hess's law lets you add reaction enthalpies because H is a state function.",
        formulas: ['ΔG = ΔH − TΔS', 'ΔG° = −RT ln K', 'ΔH = ΔU + Δn_g RT'],
        tips: ['ΔH < 0 and ΔS > 0 → spontaneous at all temperatures.']
    },
    {
        id: 'equilibrium', subject: 'chemistry', topic: 'Equilibrium', title: 'Chemical and Ionic Equilibrium',
        keywords: ['equilibrium', 'le chatelier', 'kc', 'kp', 'equilibrium constant', 'reaction quotient'],
        summary: "At equilibrium forward and reverse rates are equal. Le Chatelier's principle: a system shifts to oppose any imposed change in concentration, pressure or temperature. Only temperature changes the value of K.",
        formulas: ['Kp = Kc (RT)^Δn', 'Q < K → forward shift'],
        tips: ['Catalysts speed up reaching equilibrium but do not change K.']
    },
    {
        id: 'acid-base', subject: 'chemistry', topic: 'Acid-Base Chemistry', title: 'Acids, Bases and pH',
        keywords: ['acid', 'base', 'ph', 'poh', 'buffer', 'ka', 'kb', 'neutralization', 'hydrolysis', 'bronsted', 'lewis'],
        summary: 'pH = −log[H⁺]. At 25 °C, pH + pOH = 14. Strong acids ionise completely; weak acids partially (Ka). Buffers resist pH change and follow the Henderson–Hasselbalch equation.',
        formulas: ['pH = −log[H⁺]', 'pH + pOH = 14', 'Kw = 10⁻¹⁴ (25 °C)', 'pH = pKa + log([A⁻]/[HA])', 'Weak acid: [H⁺] = √(Ka·C)'],
        tips: ['Each tenfold dilution of a strong acid raises pH by 1 (until ~7).']
    },
    {
        id: 'electrochemistry', subject: 'chemistry', topic: 'Electrochemistry', title: 'Electrochemistry',
        keywords: ['electrochemistry', 'cell', 'electrode potential', 'nernst', 'electrolysis', 'faraday', 'emf', 'galvanic', 'anode', 'cathode'],
        summary: 'In a galvanic cell oxidation occurs at the anode and reduction at the cathode. E°cell = E°cathode − E°anode. The Nernst equation corrects for concentration; Faraday\'s laws quantify electrolysis.',
        formulas: ['E = E° − (0.0591/n) log Q (25 °C)', 'ΔG° = −nFE°', 'm = (M·I·t)/(n·F)', 'F = 96485 C/mol'],
        tips: ['"An Ox, Red Cat": anode oxidation, reduction cathode.']
    },
    {
        id: 'kinetics', subject: 'chemistry', topic: 'Chemical Kinetics', title: 'Chemical Kinetics',
        keywords: ['rate', 'kinetics', 'order', 'rate constant', 'half life', 'arrhenius', 'activation energy', 'first order'],
        summary: 'Rate laws are found experimentally. For first-order reactions the half-life is constant. The Arrhenius equation links the rate constant to temperature and activation energy.',
        formulas: ['First order: k = (2.303/t) log([A]₀/[A])', 't½ = 0.693/k (first order)', 'k = A e^(−Ea/RT)', 'Zero order: t½ = [A]₀/2k'],
        tips: ['A 10 °C rise roughly doubles the rate for many reactions.']
    },
    {
        id: 'organic-basics', subject: 'chemistry', topic: 'Organic Chemistry', title: 'Organic Chemistry Fundamentals',
        keywords: ['organic', 'iupac', 'inductive', 'resonance', 'hyperconjugation', 'carbocation', 'nucleophile', 'electrophile', 'sn1', 'sn2', 'alkene', 'alkane', 'functional group'],
        summary: 'Reactivity is driven by electronic effects (inductive, resonance, hyperconjugation). Carbocation stability: 3° > 2° > 1° > methyl. SN2 is one-step with inversion (favoured for 1° substrates); SN1 goes via a carbocation (favoured for 3°).',
        formulas: [],
        tips: ["Markovnikov's rule: H adds to the carbon that already has more H atoms.", 'Peroxide effect (anti-Markovnikov) applies to HBr only.']
    },
    {
        id: 'coordination', subject: 'chemistry', topic: 'Coordination Chemistry', title: 'Coordination Compounds',
        keywords: ['coordination', 'ligand', 'complex', 'crystal field', 'werner', 'oxidation state', 'chelate'],
        summary: 'A central metal ion bonds to ligands via coordinate bonds. Crystal field theory explains splitting of d-orbitals; strong-field ligands (CN⁻, CO) cause pairing and low-spin complexes.',
        formulas: ['Spin-only moment μ = √(n(n+2)) BM'],
        tips: ['Spectrochemical series: I⁻ < Br⁻ < Cl⁻ < F⁻ < OH⁻ < H₂O < NH₃ < en < CN⁻ < CO.']
    },
    {
        id: 'gas-laws', subject: 'chemistry', topic: 'States of Matter', title: 'Gas Laws',
        keywords: ['gas', 'ideal gas', 'boyle', 'charles', 'pressure', 'volume', 'temperature', 'pv=nrt', 'kinetic theory'],
        summary: 'The ideal gas equation combines Boyle, Charles and Avogadro laws. Real gases deviate at high pressure and low temperature (van der Waals).',
        formulas: ['PV = nRT', 'R = 8.314 J/mol·K = 0.0821 L·atm/mol·K', 'v_rms = √(3RT/M)'],
        tips: ['Always use kelvin and consistent units for R.']
    },
    {
        id: 'colligative', subject: 'chemistry', topic: 'Colligative Properties', title: 'Solutions and Colligative Properties',
        keywords: ['colligative', 'osmotic', 'boiling point elevation', 'freezing point depression', 'raoult', 'van\'t hoff', 'vapour pressure'],
        summary: "Colligative properties depend on the number of solute particles, not their identity. Raoult's law relates vapour pressure to mole fraction; the van 't Hoff factor i accounts for dissociation or association.",
        formulas: ['ΔT_b = i·K_b·m', 'ΔT_f = i·K_f·m', 'π = iCRT', 'Relative lowering = x_solute'],
        tips: ['NaCl gives i ≈ 2, CaCl₂ gives i ≈ 3 (ideal dissociation).']
    },
    {
        id: 'redox', subject: 'chemistry', topic: 'Redox Reactions', title: 'Redox Reactions',
        keywords: ['redox', 'oxidation', 'reduction', 'oxidation number', 'oxidising agent', 'reducing agent', 'balancing'],
        summary: 'Oxidation is loss of electrons (increase in oxidation number); reduction is gain (decrease). The oxidising agent gets reduced. Balance redox equations by the ion–electron or oxidation-number method.',
        formulas: [],
        tips: ['"OIL RIG": Oxidation Is Loss, Reduction Is Gain.']
    },

    // ---------------- Mathematics ----------------
    {
        id: 'quadratics', subject: 'mathematics', topic: 'Algebra', title: 'Quadratic Equations',
        keywords: ['quadratic', 'roots', 'discriminant', 'sum of roots', 'product of roots', 'polynomial', 'equation'],
        summary: 'For ax² + bx + c = 0, the discriminant D = b² − 4ac decides the nature of roots. Sum and product of roots follow directly from the coefficients.',
        formulas: ['x = (−b ± √D) / 2a', 'α + β = −b/a', 'αβ = c/a', 'D > 0 real distinct, D = 0 equal, D < 0 complex'],
        tips: ['Use α + β and αβ to find expressions like α² + β² = (α + β)² − 2αβ without solving.']
    },
    {
        id: 'calculus-derivatives', subject: 'mathematics', topic: 'Calculus', title: 'Differentiation',
        keywords: ['derivative', 'differentiation', 'maxima', 'minima', 'tangent', 'chain rule', 'rate of change', 'calculus', 'limit'],
        summary: 'The derivative is the instantaneous rate of change (slope of the tangent). Critical points satisfy f′(x) = 0; the second derivative test classifies maxima and minima.',
        formulas: ['d/dx xⁿ = n xⁿ⁻¹', '(uv)′ = u′v + uv′', 'Chain rule: dy/dx = dy/du · du/dx', 'd/dx sin x = cos x', 'd/dx eˣ = eˣ', 'd/dx ln x = 1/x'],
        tips: ["f″(x) < 0 at a critical point → local maximum.", "Use L'Hôpital's rule for 0/0 or ∞/∞ limits."]
    },
    {
        id: 'integration', subject: 'mathematics', topic: 'Integration', title: 'Integration',
        keywords: ['integral', 'integration', 'area under curve', 'definite integral', 'antiderivative'],
        summary: 'Integration reverses differentiation. Definite integrals give signed area. Useful techniques: substitution, by parts, partial fractions, and properties of definite integrals.',
        formulas: ['∫xⁿ dx = xⁿ⁺¹/(n+1) + C', '∫1/x dx = ln|x| + C', 'By parts: ∫u dv = uv − ∫v du', '∫₀ᵃ f(x)dx = ∫₀ᵃ f(a − x)dx'],
        tips: ['For by-parts, choose u using ILATE order.']
    },
    {
        id: 'trigonometry', subject: 'mathematics', topic: 'Trigonometry', title: 'Trigonometry',
        keywords: ['trigonometry', 'sin', 'cos', 'tan', 'identity', 'angle', 'trigonometric'],
        summary: 'Master the standard identities, compound-angle and multiple-angle formulas. Many problems reduce to converting everything into sin and cos.',
        formulas: ['sin²θ + cos²θ = 1', 'sin2θ = 2 sinθ cosθ', 'cos2θ = cos²θ − sin²θ = 1 − 2sin²θ', 'sin(A + B) = sinA cosB + cosA sinB', 'tan(A + B) = (tanA + tanB)/(1 − tanA tanB)'],
        tips: ['Memorise values at 0°, 30°, 45°, 60°, 90° — they appear constantly.']
    },
    {
        id: 'coordinate-geometry', subject: 'mathematics', topic: 'Coordinate Geometry', title: 'Coordinate Geometry',
        keywords: ['coordinate', 'line', 'slope', 'circle', 'parabola', 'ellipse', 'hyperbola', 'distance formula', 'conic'],
        summary: 'Lines, circles and conic sections described with equations. Know slope forms of a line, the standard forms of conics, and distance/section formulas.',
        formulas: ['Distance = √((x₂−x₁)² + (y₂−y₁)²)', 'Slope m = (y₂−y₁)/(x₂−x₁)', 'Circle: (x−h)² + (y−k)² = r²', 'Parabola y² = 4ax, focus (a, 0)', 'Perpendicular lines: m₁m₂ = −1'],
        tips: ['Distance of point from line ax + by + c = 0 is |ax₀ + by₀ + c|/√(a² + b²).']
    },
    {
        id: 'sequences', subject: 'mathematics', topic: 'Series', title: 'Sequences and Series',
        keywords: ['sequence', 'series', 'ap', 'gp', 'arithmetic progression', 'geometric progression', 'nth term', 'sum of n terms'],
        summary: 'Arithmetic progressions have a constant difference; geometric progressions have a constant ratio. Infinite GPs converge when |r| < 1.',
        formulas: ['AP: aₙ = a + (n−1)d', 'AP: Sₙ = n/2 [2a + (n−1)d]', 'GP: aₙ = arⁿ⁻¹', 'GP: Sₙ = a(rⁿ − 1)/(r − 1)', 'S_∞ = a/(1 − r)'],
        tips: ['AM ≥ GM ≥ HM for positive numbers.']
    },
    {
        id: 'combinatorics', subject: 'mathematics', topic: 'Combinatorics', title: 'Permutations and Combinations',
        keywords: ['permutation', 'combination', 'arrangement', 'selection', 'factorial', 'ncr', 'npr'],
        summary: 'Permutations count ordered arrangements; combinations count selections where order does not matter.',
        formulas: ['ⁿPᵣ = n!/(n − r)!', 'ⁿCᵣ = n!/(r!(n − r)!)', 'ⁿCᵣ = ⁿCₙ₋ᵣ', 'Circular arrangements = (n − 1)!'],
        tips: ['Ask "does order matter?" first — that decides P vs C.']
    },
    {
        id: 'probability', subject: 'mathematics', topic: 'Probability', title: 'Probability',
        keywords: ['probability', 'dice', 'coin', 'bayes', 'conditional', 'independent events', 'random'],
        summary: 'Probability = favourable outcomes / total outcomes for equally likely cases. Conditional probability and Bayes\' theorem handle dependent information.',
        formulas: ['P(A ∪ B) = P(A) + P(B) − P(A ∩ B)', 'P(A|B) = P(A ∩ B)/P(B)', 'Independent: P(A ∩ B) = P(A)P(B)', 'Binomial: P(X = r) = ⁿCᵣ pʳ qⁿ⁻ʳ'],
        tips: ['"At least one" problems are easiest via 1 − P(none).']
    },
    {
        id: 'complex-numbers', subject: 'mathematics', topic: 'Complex Numbers', title: 'Complex Numbers',
        keywords: ['complex', 'imaginary', 'iota', 'modulus', 'argument', 'argand', 'de moivre', 'conjugate'],
        summary: 'A complex number z = a + ib has modulus √(a² + b²) and argument tan⁻¹(b/a) (quadrant-adjusted). Polar form makes multiplication and powers easy.',
        formulas: ['i² = −1, i⁴ = 1', '|z|² = z·z̄', 'z = r(cosθ + i sinθ) = re^(iθ)', "De Moivre: (cosθ + i sinθ)ⁿ = cos nθ + i sin nθ"],
        tips: ['Cube roots of unity: 1 + ω + ω² = 0 and ω³ = 1.']
    },
    {
        id: 'matrices', subject: 'mathematics', topic: 'Matrices', title: 'Matrices and Determinants',
        keywords: ['matrix', 'matrices', 'determinant', 'inverse', 'adjoint', 'transpose', 'linear equations'],
        summary: 'A square matrix is invertible if and only if its determinant is non-zero. Determinants give areas/volumes and solve linear systems (Cramer\'s rule).',
        formulas: ['A⁻¹ = adj(A)/|A|', '|AB| = |A||B|', '|kA| = kⁿ|A| (n×n)', '|Aᵀ| = |A|'],
        tips: ['|adj A| = |A|ⁿ⁻¹ for an n×n matrix.']
    },
    {
        id: 'vectors', subject: 'mathematics', topic: 'Vectors', title: 'Vectors',
        keywords: ['vector', 'dot product', 'cross product', 'scalar product', 'unit vector', 'projection'],
        summary: 'Dot product gives a scalar (|a||b|cosθ) and tests perpendicularity; cross product gives a vector perpendicular to both with magnitude |a||b|sinθ (area of parallelogram).',
        formulas: ['a·b = |a||b|cosθ', '|a × b| = |a||b|sinθ', 'Projection of a on b = (a·b)/|b|', 'Scalar triple product = volume of parallelepiped'],
        tips: ['a·b = 0 ⇒ perpendicular; a × b = 0 ⇒ parallel.']
    },
    {
        id: 'logarithms', subject: 'mathematics', topic: 'Logarithms', title: 'Logarithms',
        keywords: ['log', 'logarithm', 'ln', 'exponent', 'base change'],
        summary: 'log_b(x) = y means bʸ = x. Logarithms turn products into sums and powers into multiples.',
        formulas: ['log(ab) = log a + log b', 'log(a/b) = log a − log b', 'log(aⁿ) = n log a', 'log_b a = log a / log b'],
        tips: ['log is only defined for positive arguments and bases ≠ 1.']
    },

    // ---------------- Biology ----------------
    {
        id: 'cell-biology', subject: 'biology', topic: 'Cell Biology', title: 'Cell Structure and Function',
        keywords: ['cell', 'organelle', 'mitochondria', 'ribosome', 'nucleus', 'membrane', 'prokaryote', 'eukaryote', 'golgi', 'lysosome', 'endoplasmic'],
        summary: 'Eukaryotic cells have membrane-bound organelles; prokaryotes do not. Mitochondria are the site of aerobic respiration; ribosomes synthesise proteins (70S in prokaryotes, 80S in eukaryotic cytoplasm).',
        formulas: [],
        tips: ['Mitochondria and chloroplasts have their own DNA and 70S ribosomes (endosymbiotic theory).', 'Lysosomes are called "suicide bags".']
    },
    {
        id: 'cell-division', subject: 'biology', topic: 'Cell Division', title: 'Cell Cycle and Cell Division',
        keywords: ['mitosis', 'meiosis', 'cell cycle', 'interphase', 'prophase', 'metaphase', 'anaphase', 'crossing over', 'chromosome'],
        summary: 'Mitosis produces two genetically identical diploid cells. Meiosis produces four haploid cells and introduces variation through crossing over (pachytene) and independent assortment.',
        formulas: [],
        tips: ['DNA replicates in S phase.', 'Crossing over happens during pachytene of prophase I.']
    },
    {
        id: 'genetics', subject: 'biology', topic: 'Genetics', title: 'Principles of Inheritance',
        keywords: ['genetics', 'mendel', 'allele', 'dominant', 'recessive', 'monohybrid', 'dihybrid', 'genotype', 'phenotype', 'inheritance', 'linkage', 'hardy weinberg'],
        summary: "Mendel's laws: dominance, segregation and independent assortment. Monohybrid F₂ phenotypic ratio 3:1 (genotypic 1:2:1); dihybrid F₂ ratio 9:3:3:1. Incomplete dominance gives 1:2:1 phenotypes.",
        formulas: ['Monohybrid F₂: 3:1', 'Dihybrid F₂: 9:3:3:1', 'Test cross (Aa × aa): 1:1', 'Hardy–Weinberg: p² + 2pq + q² = 1'],
        tips: ['Linked genes do not assort independently — recombination frequency ∝ distance.']
    },
    {
        id: 'molecular-biology', subject: 'biology', topic: 'Molecular Biology', title: 'Molecular Basis of Inheritance',
        keywords: ['dna', 'rna', 'replication', 'transcription', 'translation', 'codon', 'genetic code', 'lac operon', 'central dogma'],
        summary: 'Central dogma: DNA → RNA → protein. DNA replication is semi-conservative. The genetic code is triplet, degenerate and nearly universal; AUG is the start codon, UAA/UAG/UGA are stop codons.',
        formulas: ["Chargaff's rule: A = T, G = C"],
        tips: ['Meselson–Stahl proved semi-conservative replication using ¹⁵N.']
    },
    {
        id: 'photosynthesis', subject: 'biology', topic: 'Photosynthesis', title: 'Photosynthesis',
        keywords: ['photosynthesis', 'chlorophyll', 'light reaction', 'calvin cycle', 'c4', 'photorespiration', 'rubisco', 'chloroplast'],
        summary: 'Light reactions (thylakoid) split water, release O₂ and make ATP + NADPH. The Calvin cycle (stroma) fixes CO₂ using RuBisCO. C₄ plants avoid photorespiration using Kranz anatomy.',
        formulas: ['6CO₂ + 12H₂O → C₆H₁₂O₆ + 6O₂ + 6H₂O', 'Calvin cycle: 3 ATP + 2 NADPH per CO₂'],
        tips: ['The O₂ released comes from water, not CO₂.']
    },
    {
        id: 'respiration', subject: 'biology', topic: 'Respiration', title: 'Respiration in Plants and Animals',
        keywords: ['respiration', 'glycolysis', 'krebs', 'electron transport', 'atp', 'fermentation', 'aerobic', 'anaerobic'],
        summary: 'Glycolysis (cytoplasm) splits glucose into pyruvate. In aerobic conditions pyruvate enters the Krebs cycle (mitochondrial matrix) and the electron transport chain (inner membrane) makes most ATP.',
        formulas: ['Net ATP from glycolysis = 2', 'RQ of carbohydrate = 1, fat ≈ 0.7, protein ≈ 0.9'],
        tips: ['Oxygen is the final electron acceptor in the ETC.']
    },
    {
        id: 'human-physiology', subject: 'biology', topic: 'Physiology', title: 'Human Physiology',
        keywords: ['heart', 'blood', 'kidney', 'nephron', 'digestion', 'breathing', 'hormone', 'neuron', 'physiology', 'circulation', 'enzyme'],
        summary: 'Key systems: circulation (double circulation, 4-chambered heart), excretion (nephron: filtration, reabsorption, secretion), digestion (enzymes along the gut), neural and hormonal control.',
        formulas: ['Cardiac output = stroke volume × heart rate ≈ 5 L/min', 'GFR ≈ 125 mL/min'],
        tips: ['Most reabsorption happens in the PCT.', 'The SA node is the natural pacemaker.']
    },
    {
        id: 'ecology', subject: 'biology', topic: 'Ecology', title: 'Ecology and Environment',
        keywords: ['ecology', 'ecosystem', 'food chain', 'population', 'biodiversity', 'energy flow', 'pyramid', 'succession'],
        summary: 'Energy flows one way through trophic levels with ~10% transfer efficiency (Lindeman). Pyramids of energy are always upright. Biodiversity is conserved in situ (national parks) and ex situ (seed banks, zoos).',
        formulas: ['10% law of energy transfer', 'Logistic growth: dN/dt = rN(K − N)/K'],
        tips: ['Pyramid of biomass in oceans is inverted.']
    },
    {
        id: 'evolution', subject: 'biology', topic: 'Evolution', title: 'Evolution',
        keywords: ['evolution', 'darwin', 'natural selection', 'homologous', 'analogous', 'speciation', 'fossil', 'lamarck'],
        summary: 'Natural selection acts on heritable variation. Homologous organs indicate divergent evolution; analogous organs indicate convergent evolution. Hardy–Weinberg equilibrium is disturbed by mutation, gene flow, drift and selection.',
        formulas: ['p + q = 1', 'p² + 2pq + q² = 1'],
        tips: ["Industrial melanism (peppered moth) is a classic example of natural selection."]
    },
    {
        id: 'plant-physiology', subject: 'biology', topic: 'Plant Physiology', title: 'Plant Physiology',
        keywords: ['transpiration', 'auxin', 'gibberellin', 'cytokinin', 'plant hormone', 'stomata', 'xylem', 'phloem', 'photoperiodism'],
        summary: 'Water moves up the xylem by the cohesion–tension (transpiration pull) mechanism. Plant growth regulators: auxin (apical dominance), gibberellin (stem elongation), cytokinin (cell division), ABA (stress), ethylene (ripening).',
        formulas: [],
        tips: ['ABA is the "stress hormone" that closes stomata.']
    },
    {
        id: 'immunity', subject: 'biology', topic: 'Immunity', title: 'Human Health and Immunity',
        keywords: ['immunity', 'antibody', 'antigen', 'vaccine', 'lymphocyte', 'disease', 'pathogen', 'innate', 'acquired'],
        summary: 'Innate immunity is non-specific; acquired immunity is specific and has memory. B cells make antibodies (humoral); T cells mediate cell-mediated immunity. Vaccines trigger memory without disease.',
        formulas: ['Antibody = 2 heavy + 2 light chains (H₂L₂)'],
        tips: ['IgA is found in colostrum; IgE is linked to allergies.']
    }
];

// Exam strategy knowledge for tips intents.
const STRATEGY = {
    general: [
        'Do a first pass answering every question you are confident about, then return for the harder ones.',
        'With −1 negative marking, only guess when you can eliminate at least two options.',
        'Spend no more than ~2 minutes on a question during the first pass — mark it and move on.',
        'Review your mistakes within 24 hours of a test; that is when the learning sticks.'
    ],
    time: [
        'Use the 1-minute rule: if you have no approach after a minute, mark for review and move on.',
        'Practise with a timer every time — speed is a skill that only builds under time pressure.',
        'Split study sessions into 50-minute focused blocks with 10-minute breaks.',
        'Plan your week on Sunday: allocate more hours to weak subjects, but touch every subject.'
    ],
    stress: [
        'Anxiety before a test is normal — slow breathing (4 seconds in, 6 seconds out) calms the nervous system quickly.',
        'Sleep 7–8 hours; memory consolidation happens during sleep.',
        'Compare yourself only with your past self — your trend matters more than any single score.',
        'Short daily practice beats long occasional cramming.'
    ]
};

module.exports = { KNOWLEDGE, STRATEGY };
