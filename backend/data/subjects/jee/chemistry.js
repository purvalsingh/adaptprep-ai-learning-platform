const jeeChemistryQuestions = {
    test1: [
        {
            id: 1,
            question: "What is the IUPAC name of CH₃-CH(CH₃)-CH₂-CH₃?",
            options: ["2-methylbutane", "3-methylbutane", "Isopentane", "Neopentane"],
            correct: 0,
            topic: "Organic Chemistry",
            difficulty: "easy",
            theory: "In IUPAC nomenclature, we identify the longest carbon chain and number it from the end that gives the substituent the lowest number. Here, the longest chain has 4 carbons (butane), and the methyl group is at position 2. Hence, the IUPAC name is 2-methylbutane.",
            explanation: "The compound has a 4-carbon main chain with a methyl group at position 2. IUPAC name = 2-methylbutane."
        },
        {
            id: 2,
            question: "The oxidation state of Cr in K₂Cr₂O₇ is:",
            options: ["+3", "+6", "+7", "+2"],
            correct: 1,
            topic: "Redox Reactions",
            difficulty: "medium",
            theory: "To find the oxidation state of Cr in K₂Cr₂O₇: K has +1 oxidation state, O has -2 oxidation state. Let Cr have oxidation state x. Then: 2(+1) + 2(x) + 7(-2) = 0. Therefore, 2 + 2x - 14 = 0, which gives 2x = 12, so x = +6.",
            explanation: "In K₂Cr₂O₇, using oxidation state rules: K(+1) + Cr(x) + O(-2). Sum: 2(+1) + 2x + 7(-2) = 0 → 2x = 12 → x = +6."
        },
        {
            id: 3,
            question: "Which of the following is the most acidic?",
            options: ["Phenol", "Ethanol", "Water", "Acetic acid"],
            correct: 3,
            topic: "Organic Chemistry",
            difficulty: "medium",
            theory: "Acidity is determined by the ease of donating a proton. Acetic acid (CH₃COOH) is a carboxylic acid with the highest Ka value among the options.",
            explanation: "Acetic acid (carboxylic acid) is the most acidic because carboxylic acids are much more acidic than phenols, water, or alcohols."
        },
        {
            id: 4,
            question: "The subshell that fills before 4d in the aufbau principle is:",
            options: ["4p", "5s", "4s", "3d"],
            correct: 3,
            topic: "Atomic Structure",
            difficulty: "medium",
            theory: "According to the aufbau principle using (n + l) rule: 3d fills before 4d. The order near this region is 4s → 3d → 4p.",
            explanation: "Using (n+l) rule where 3d has (n+l)=5 and 4d has (n+l)=6. 3d fills first."
        },
        {
            id: 5,
            question: "What is the shape of the PCl₅ molecule?",
            options: ["Linear", "Trigonal pyramidal", "Trigonal bipyramidal", "Square planar"],
            correct: 2,
            topic: "Chemical Bonding",
            difficulty: "medium",
            theory: "PCl₅ has a phosphorus atom at the center with 5 chlorine atoms bonded to it. Using VSEPR theory with 5 bonding pairs and 0 lone pairs, this gives a trigonal bipyramidal geometry.",
            explanation: "PCl₅: P has 5 electron regions (5 bonding pairs, 0 lone pairs) → Trigonal bipyramidal shape."
        },
        {
            id: 6,
            question: "Which has the highest first ionization energy?",
            options: ["Na", "Mg", "Al", "Si"],
            correct: 3,
            topic: "Periodic Trends",
            difficulty: "medium",
            theory: "First ionization energy generally increases across a period as effective nuclear charge rises. There is one exception here: Mg (filled 3s²) is higher than Al (3s²3p¹), because Al's 3p electron is shielded and easier to remove.",
            explanation: "Order: Si (786 kJ/mol) > Mg (738) > Al (577) > Na (496). Si is highest; note the Mg > Al anomaly caused by Mg's filled 3s² subshell."
        },
        {
            id: 7,
            question: "The bond angle in NH₃ is approximately:",
            options: ["109.5°", "107°", "120°", "90°"],
            correct: 1,
            topic: "Molecular Structure",
            difficulty: "medium",
            theory: "NH₃ has 3 bonding pairs and 1 lone pair. VSEPR theory predicts tetrahedral electron geometry, but the molecular geometry is trigonal pyramidal. The bond angle is approximately 107° due to lone pair repulsion being greater than bonding pair repulsion.",
            explanation: "NH₃ has 1 lone pair which repels bonding pairs more strongly, reducing bond angle from 109.5° to ~107°."
        },
        {
            id: 8,
            question: "Which is not a reducing sugar?",
            options: ["Glucose", "Fructose", "Sucrose", "Maltose"],
            correct: 2,
            topic: "Carbohydrates",
            difficulty: "medium",
            theory: "Reducing sugars have a free or potentially free aldehyde or ketone group. Sucrose is a disaccharide made from glucose and fructose with a 1,2-glycosidic linkage that prevents the anomeric carbons from existing in open form. Thus, sucrose is a non-reducing sugar.",
            explanation: "Sucrose lacks a free aldehyde or ketone group, making it non-reducing unlike glucose, fructose, and maltose."
        },
        {
            id: 9,
            question: "The hydration of alkenes follows Markovnikov's rule, which states:",
            options: ["H adds to less substituted C", "OH adds to more substituted C", "Both A and B", "No specific pattern"],
            correct: 2,
            topic: "Organic Reaction Mechanisms",
            difficulty: "hard",
            theory: "Markovnikov's rule states that in addition reactions to unsymmetrical alkenes, the hydrogen adds to the carbon atom of the double bond that already has more hydrogen atoms (less substituted), and the other group adds to the more substituted carbon.",
            explanation: "Markovnikov's rule: H adds to less substituted C, and OH adds to more substituted C."
        },
        {
            id: 10,
            question: "The normality of a 10 N sulfuric acid solution is:",
            options: ["5 N", "10 N", "20 N", "2.5 N"],
            correct: 2,
            topic: "Analytical Chemistry",
            difficulty: "medium",
            theory: "Normality = Molarity × n, where n is the number of replaceable H⁺ ions or OH⁻ ions. For H₂SO₄, n = 2 (diprotic acid). If 10 N refers to molarity, then Normality = 10 × 2 = 20 N.",
            explanation: "H₂SO₄ has 2 replaceable H⁺ ions. Normality = Molarity × 2 = 10 × 2 = 20 N."
        }
    ],
    test2: [
        {
            id: 11,
            question: "What is the conjugate base of HCO₃⁻?",
            options: ["H₂CO₃", "CO₃²⁻", "CO₂", "H₂O"],
            correct: 1,
            topic: "Acid-Base Chemistry",
            difficulty: "medium",
            theory: "A conjugate base is formed when a Brønsted-Lowry acid donates a proton (H⁺). HCO₃⁻ loses H⁺ to form CO₃²⁻. Therefore, CO₃²⁻ is the conjugate base of HCO₃⁻.",
            explanation: "HCO₃⁻ - H⁺ = CO₃²⁻. The conjugate base of HCO₃⁻ is CO₃²⁻."
        },
        {
            id: 12,
            question: "The bond dissociation energy is highest for:",
            options: ["C-C bond", "C=C bond", "C≡C bond", "C-H bond"],
            correct: 2,
            topic: "Chemical Bonding",
            difficulty: "medium",
            theory: "Bond dissociation energy increases with bond order. A triple bond (C≡C) has the highest bond order (3), followed by double bond (C=C) with order 2, and single bonds (C-C, C-H) with order 1. Triple bonds require the most energy to break.",
            explanation: "Triple bonds have the highest bond order and therefore the highest bond dissociation energy."
        },
        {
            id: 13,
            question: "Which of the following has maximum number of unpaired electrons?",
            options: ["Fe²⁺", "Fe³⁺", "Mn²⁺", "Co²⁺"],
            correct: 2,
            topic: "Coordination Chemistry",
            difficulty: "hard",
            theory: "Fe²⁺: [Ar]3d⁶ has 4 unpaired electrons. Fe³⁺: [Ar]3d⁵ has 5 unpaired electrons. Mn²⁺: [Ar]3d⁵ has 5 unpaired electrons. Co²⁺: [Ar]3d⁷ has 3 unpaired electrons. Both Mn²⁺ and Fe³⁺ have 5 unpaired electrons, which is maximum.",
            explanation: "Mn²⁺ and Fe³⁺ both have d⁵ configuration with 5 unpaired electrons, the maximum among the options."
        },
        {
            id: 14,
            question: "The enthalpy change for a reaction at standard conditions is symbolized as:",
            options: ["ΔH", "ΔH°", "ΔG°", "ΔS°"],
            correct: 1,
            topic: "Thermochemistry",
            difficulty: "easy",
            theory: "Standard enthalpy change (ΔH°) refers to the enthalpy change when reactants in their standard states convert to products in their standard states at standard temperature and pressure (usually 25°C and 1 atm).",
            explanation: "ΔH° represents standard enthalpy change under standard conditions."
        },
        {
            id: 15,
            question: "Which exhibits resonance?",
            options: ["CH₄", "C₂H₆", "C₂H₄", "C₆H₆"],
            correct: 3,
            topic: "Chemical Bonding",
            difficulty: "medium",
            theory: "Resonance occurs when a molecule can be represented by multiple Lewis structures with the same atomic arrangement but different electron distributions. Benzene (C₆H₆) exhibits resonance with alternating single and double bonds.",
            explanation: "Benzene exhibits resonance between two equivalent Kekulé structures."
        },
        {
            id: 16,
            question: "The pKa of acetic acid is 4.74. Its Ka value is:",
            options: ["4.74 × 10⁻⁵", "1.82 × 10⁻⁵", "4.74", "2.74 × 10⁻⁵"],
            correct: 1,
            topic: "Equilibrium Chemistry",
            difficulty: "medium",
            theory: "pKa = -log(Ka). Therefore, Ka = 10^(-pKa) = 10^(-4.74) ≈ 1.82 × 10⁻⁵.",
            explanation: "Ka = 10^(-pKa) = 10^(-4.74) ≈ 1.82 × 10⁻⁵."
        },
        {
            id: 17,
            question: "In a reaction at equilibrium, the forward and reverse reactions:",
            options: ["Stop occurring", "Have equal rates", "Only forward occurs", "Only reverse occurs"],
            correct: 1,
            topic: "Chemical Equilibrium",
            difficulty: "easy",
            theory: "At chemical equilibrium, the rate of forward reaction equals the rate of reverse reaction. While both reactions continue to occur at the molecular level, there is no net change in concentrations.",
            explanation: "At equilibrium, rate of forward reaction = rate of reverse reaction."
        },
        {
            id: 18,
            question: "Esterification is a reaction between:",
            options: ["Carboxylic acid and alcohol", "Ketone and alcohol", "Aldehyde and alcohol", "Ether and alcohol"],
            correct: 0,
            topic: "Organic Reactions",
            difficulty: "easy",
            theory: "Esterification is a condensation reaction where a carboxylic acid reacts with an alcohol to form an ester and water. The reaction is typically catalyzed by an acid like H₂SO₄.",
            explanation: "Esterification: R-COOH + R'-OH → R-COO-R' + H₂O."
        },
        {
            id: 19,
            question: "The molecular formula for benzene is:",
            options: ["C₆H₄", "C₆H₆", "C₆H₈", "C₇H₆"],
            correct: 1,
            topic: "Aromatic Chemistry",
            difficulty: "easy",
            theory: "Benzene is an aromatic hydrocarbon containing a six-membered ring with alternating single-double bonds (or more accurately, delocalized electrons). Its molecular formula is C₆H₆.",
            explanation: "Benzene: C₆H₆ is an aromatic compound with a planar ring structure."
        },
        {
            id: 20,
            question: "The lanthanides are characterized by filling of:",
            options: ["4f orbitals", "5f orbitals", "4d orbitals", "5d orbitals"],
            correct: 0,
            topic: "Periodic Table",
            difficulty: "medium",
            theory: "Lanthanides are a series of 15 elements with the filling of 4f orbitals. They have electron configurations of [Xe]4f^(1-14)5d^(0-1)6s². The lanthanide series includes elements from Cerium (Ce) to Lutetium (Lu).",
            explanation: "Lanthanides fill 4f orbitals, elements with atomic numbers 58-71."
        }
    ],
    test3: [
        {
            id: 21,
            question: "Which is a strong electrolyte?",
            options: ["CH₃COOH", "NH₃", "HCl", "H₂CO₃"],
            correct: 2,
            topic: "Electrolytes and Electrolysis",
            difficulty: "medium",
            theory: "Strong electrolytes completely dissociate in solution. HCl fully ionizes to H⁺ and Cl⁻. CH₃COOH (weak acid), NH₃ (weak base), and H₂CO₃ (weak acid) partially dissociate.",
            explanation: "HCl is a strong electrolyte, fully ionizing in water."
        },
        {
            id: 22,
            question: "The rate law for a reaction is Rate = k[A]². This is:",
            options: ["First order", "Second order", "Third order", "Zero order"],
            correct: 1,
            topic: "Reaction Kinetics",
            difficulty: "medium",
            theory: "The order of a reaction is the sum of the exponents of concentration terms in the rate law. For Rate = k[A]², the exponent is 2, so it's a second-order reaction.",
            explanation: "Order = sum of exponents in rate law = 2."
        },
        {
            id: 23,
            question: "In electrochemistry, oxidation occurs at the:",
            options: ["Cathode", "Anode", "Both equally", "Neither"],
            correct: 1,
            topic: "Electrochemistry",
            difficulty: "easy",
            theory: "Oxidation is the loss of electrons. In an electrochemical cell, oxidation always occurs at the anode. Reduction (gain of electrons) occurs at the cathode.",
            explanation: "Oxidation occurs at the anode; reduction occurs at the cathode."
        },
        {
            id: 24,
            question: "The Ksp expression for AgCl is:",
            options: ["[Ag⁺][Cl⁻]", "[Ag⁺]²[Cl⁻]²", "[Ag⁺][Cl⁻]²", "[Ag⁺]²[Cl⁻]"],
            correct: 0,
            topic: "Solubility Equilibria",
            difficulty: "easy",
            theory: "The solubility product Ksp for AgCl is [Ag⁺][Cl⁻] because AgCl dissociates as AgCl ⇌ Ag⁺ + Cl⁻ with a 1:1 stoichiometry.",
            explanation: "AgCl ⇌ Ag⁺ + Cl⁻. Ksp = [Ag⁺][Cl⁻]."
        },
        {
            id: 25,
            question: "Which is not a colligative property?",
            options: ["Boiling point elevation", "Freezing point depression", "Color", "Osmotic pressure"],
            correct: 2,
            topic: "Colligative Properties",
            difficulty: "medium",
            theory: "Colligative properties depend only on the number of solute particles, not their identity. These include boiling point elevation, freezing point depression, and osmotic pressure. Color is a property that depends on the chemical identity of the substance.",
            explanation: "Color is not a colligative property; colligative properties depend only on particle count."
        },
        {
            id: 26,
            question: "A buffer solution contains a weak acid and its:",
            options: ["Strong base", "Weak base", "Conjugate base salt", "Alcohol"],
            correct: 2,
            topic: "Buffers",
            difficulty: "medium",
            theory: "A buffer solution contains a weak acid and its conjugate base (usually as a salt). The Henderson-Hasselbalch equation relates pH to the ratio of conjugate base to weak acid concentration.",
            explanation: "Buffer = weak acid + its conjugate base salt (usually)."
        },
        {
            id: 27,
            question: "The electronegativity difference for an ionic bond is:",
            options: ["< 0.4", "0.4 - 1.8", "> 1.8", "Exactly 1.0"],
            correct: 2,
            topic: "Chemical Bonding",
            difficulty: "medium",
            theory: "Ionic bonds typically form when the electronegativity difference between two elements is greater than 1.8 (or sometimes stated as >1.7). This large difference indicates significant electron transfer.",
            explanation: "Ionic bonds: electronegativity difference > 1.8."
        },
        {
            id: 28,
            question: "Which compound shows isomerism?",
            options: ["CH₄", "C₂H₆", "C₂H₄", "C₄H₁₀"],
            correct: 3,
            topic: "Isomerism",
            difficulty: "medium",
            theory: "Isomers are compounds with the same molecular formula but different structural arrangements. C₄H₁₀ has two isomers: n-butane and isobutane (2-methylpropane).",
            explanation: "C₄H₁₀ has isomerism: n-butane and isobutane."
        },
        {
            id: 29,
            question: "The theoretical yield of a reaction is:",
            options: ["Always less than actual yield", "Maximum possible yield", "Always more than actual yield", "Equal to actual yield"],
            correct: 1,
            topic: "Stoichiometry",
            difficulty: "easy",
            theory: "Theoretical yield is the maximum amount of product that could be produced if the reaction goes to completion with no losses. Actual yield is always less than or equal to theoretical yield due to side reactions, incomplete reactions, and losses.",
            explanation: "Theoretical yield is the maximum possible product amount."
        },
        {
            id: 30,
            question: "Which has the smallest ionic radius?",
            options: ["Na⁺", "Mg²⁺", "Al³⁺", "Cl⁻"],
            correct: 2,
            topic: "Periodic Trends",
            difficulty: "medium",
            theory: "Among ions with the same number of electrons (isoelectronic series), the ion with the highest nuclear charge (most protons) has the smallest ionic radius. Al³⁺ has 10 electrons with 13 protons. Na⁺ has 10 electrons with 11 protons. Cl⁻ has 18 electrons with 17 protons.",
            explanation: "Al³⁺ has the highest charge-to-electron ratio, resulting in smallest radius."
        }
    ],
    test4: [
        {
            id: 31,
            question: "The volume of 1 mole of any ideal gas at STP is:",
            options: ["11.2 L", "22.4 L", "44.8 L", "5.6 L"],
            correct: 1,
            topic: "Gas Laws",
            difficulty: "easy",
            theory: "At Standard Temperature and Pressure (STP: 0°C and 1 atm), using the ideal gas law PV = nRT, 1 mole of gas occupies 22.4 L. This is known as the molar volume of a gas at STP.",
            explanation: "Molar volume at STP = 22.4 L/mol."
        },
        {
            id: 32,
            question: "The percent composition of oxygen in H₂O is approximately:",
            options: ["8.9%", "11.1%", "88.9%", "50%"],
            correct: 2,
            topic: "Stoichiometry",
            difficulty: "medium",
            theory: "Molar mass of H₂O = 2(1) + 16 = 18 g/mol. Mass of O = 16 g. Percent O = (16/18) × 100 = 88.9%.",
            explanation: "% O = (16/18) × 100 = 88.9% in H₂O."
        },
        {
            id: 33,
            question: "The VSEPR theory predicts the shape of molecule based on:",
            options: ["Number of bonds only", "Number of atoms only", "Electron domains", "Mass of atoms"],
            correct: 2,
            topic: "Molecular Structure",
            difficulty: "medium",
            theory: "VSEPR (Valence Shell Electron Pair Repulsion) theory predicts molecular shape based on electron domains (bonding and lone pairs) around the central atom, not just bonds or number of atoms.",
            explanation: "VSEPR predicts shape based on electron domain geometry."
        },
        {
            id: 34,
            question: "Double bond consists of:",
            options: ["1 σ and 1 π bond", "2 σ bonds", "2 π bonds", "1 σ and 2 π bonds"],
            correct: 0,
            topic: "Chemical Bonding",
            difficulty: "medium",
            theory: "A double bond consists of one sigma (σ) bond and one pi (π) bond. The σ bond is formed by direct overlap along the internuclear axis, while the π bond is formed by lateral overlap of p orbitals.",
            explanation: "Double bond = 1 σ + 1 π bond."
        },
        {
            id: 35,
            question: "Which element has the highest electronegativity?",
            options: ["O", "F", "Cl", "N"],
            correct: 1,
            topic: "Periodic Table",
            difficulty: "easy",
            theory: "Fluorine (F) has the highest electronegativity value of all elements (4.0 on the Pauling scale). This is due to its small atomic size and high nuclear charge.",
            explanation: "Fluorine is the most electronegative element."
        },
        {
            id: 36,
            question: "Dehydration of alcohols produces:",
            options: ["Alkanes", "Alkenes", "Alkynes", "Diols"],
            correct: 1,
            topic: "Organic Reactions",
            difficulty: "medium",
            theory: "Dehydration of alcohols is an elimination reaction where water (H₂O) is removed, resulting in the formation of a double bond. R-CH₂-CH₂-OH → R-CH=CH₂ + H₂O.",
            explanation: "Dehydration removes water and forms alkenes."
        },
        {
            id: 37,
            question: "The catalyst in a reaction:",
            options: ["Is consumed", "Increases activation energy", "Decreases activation energy", "Changes equilibrium position"],
            correct: 2,
            topic: "Catalysis",
            difficulty: "easy",
            theory: "A catalyst is a substance that increases the rate of reaction by decreasing the activation energy without being consumed in the reaction. It is regenerated at the end.",
            explanation: "Catalyst decreases activation energy and is not consumed."
        },
        {
            id: 38,
            question: "In the reaction: 2H₂ + O₂ → 2H₂O, the oxidation number of O changes from:",
            options: ["0 to -2", "-2 to 0", "+2 to -2", "-1 to -2"],
            correct: 0,
            topic: "Redox Chemistry",
            difficulty: "medium",
            theory: "In O₂ (elemental state), oxygen has oxidation number 0. In H₂O, oxygen has oxidation number -2 (negative because O is more electronegative than H).",
            explanation: "O: 0 (in O₂) → -2 (in H₂O). Oxygen is reduced."
        },
        {
            id: 39,
            question: "Allotropes are:",
            options: ["Different isotopes", "Different forms of same element", "Different compounds", "Ionic compounds"],
            correct: 1,
            topic: "Periodic Table",
            difficulty: "easy",
            theory: "Allotropes are different physical forms of the same element in the same physical state. Examples include oxygen (O₂ and O₃), carbon (diamond, graphite, fullerene), and phosphorus (white and red).",
            explanation: "Allotropes are different forms of the same element."
        },
        {
            id: 40,
            question: "The pH of 0.1 M HCl solution is:",
            options: ["0", "1", "2", "7"],
            correct: 1,
            topic: "Acid-Base Equilibria",
            difficulty: "easy",
            theory: "HCl is a strong acid that completely ionizes. [H⁺] = 0.1 M = 10⁻¹ M. pH = -log[H⁺] = -log(10⁻¹) = 1.",
            explanation: "pH = -log(0.1) = -log(10⁻¹) = 1."
        }
    ],
    test5: [
        {
            id: 41,
            question: "Amino acids are organic compounds containing:",
            options: ["Only C and H", "C, H, and N", "C, H, O, and N", "C, H, N, and S"],
            correct: 2,
            topic: "Biomolecules",
            difficulty: "easy",
            theory: "Amino acids are the building blocks of proteins. They contain a carboxyl group (-COOH), an amino group (-NH₂), a hydrogen atom, and a unique side chain (R group) bonded to a central carbon atom.",
            explanation: "Amino acids have C, H, O, and N atoms; some also have S."
        },
        {
            id: 42,
            question: "The number of structural isomers of C₅H₁₂ is:",
            options: ["2", "3", "4", "5"],
            correct: 2,
            topic: "Isomerism",
            difficulty: "hard",
            theory: "C₅H₁₂ (pentane) has three structural isomers: n-pentane, isopentane (2-methylbutane), and neopentane (2,2-dimethylpropane).",
            explanation: "Pentane has 3 structural isomers."
        },
        {
            id: 43,
            question: "Which is not a valid Lewis structure?",
            options: ["CO", "NO", "N₂", "O₃"],
            correct: 0,
            topic: "Chemical Bonding",
            difficulty: "hard",
            theory: "All given options can form valid Lewis structures. CO has a triple bond with a lone pair on C and O. More information needed for this question, but typically all can be represented validly.",
            explanation: "All given options have valid Lewis structures."
        },
        {
            id: 44,
            question: "The heat of combustion is always:",
            options: ["Positive", "Negative", "Zero", "Variable"],
            correct: 1,
            topic: "Thermochemistry",
            difficulty: "easy",
            theory: "Combustion reactions are exothermic (release heat). The heat of combustion is defined as the heat released when 1 mole of substance completely burns in oxygen. Therefore, ΔH_combustion is always negative.",
            explanation: "Heat of combustion is negative (exothermic)."
        },
        {
            id: 45,
            question: "Which metal cannot displace Cu from CuSO₄?",
            options: ["Zn", "Fe", "Ag", "Al"],
            correct: 2,
            topic: "Electrochemistry",
            difficulty: "medium",
            theory: "The reactivity series determines which metal can displace another. Ag is less reactive than Cu, so it cannot displace Cu from solution. Zn, Fe, and Al are all more reactive than Cu.",
            explanation: "Ag is less reactive than Cu, so cannot displace Cu²⁺."
        },
        {
            id: 46,
            question: "A solution with pH = 10 has pOH =:",
            options: ["4", "10", "14", "6"],
            correct: 0,
            topic: "Acid-Base Chemistry",
            difficulty: "easy",
            theory: "pH + pOH = 14 at 25°C. If pH = 10, then pOH = 14 - 10 = 4.",
            explanation: "pOH = 14 - pH = 14 - 10 = 4."
        },
        {
            id: 47,
            question: "The empirical formula of a compound is CH₂. Its molecular weight is 42. The molecular formula is:",
            options: ["CH₂", "C₂H₄", "C₃H₆", "C₄H₈"],
            correct: 2,
            topic: "Stoichiometry",
            difficulty: "medium",
            theory: "Empirical formula mass of CH₂ = 12 + 2 = 14. n = Molecular weight / Empirical formula mass = 42 / 14 = 3. Molecular formula = (CH₂)₃ = C₃H₆.",
            explanation: "n = 42/14 = 3. Molecular formula = (CH₂)₃ = C₃H₆."
        },
        {
            id: 48,
            question: "In a galvanic cell, electrons flow from:",
            options: ["Cathode to anode through external circuit", "Anode to cathode through salt bridge", "Anode to cathode through external circuit", "Cathode to anode through salt bridge"],
            correct: 2,
            topic: "Electrochemistry",
            difficulty: "medium",
            theory: "In a galvanic cell, oxidation occurs at the anode (loses electrons) and reduction occurs at the cathode (gains electrons). Electrons flow through the external circuit from anode to cathode.",
            explanation: "Electrons flow anode → cathode through external circuit."
        },
        {
            id: 49,
            question: "The general formula for alkenes is:",
            options: ["CₙH₂ₙ₊₂", "CₙH₂ₙ", "CₙH₂ₙ₋₂", "CₙHₙ"],
            correct: 1,
            topic: "Organic Chemistry",
            difficulty: "easy",
            theory: "Alkenes contain one carbon-carbon double bond. Their general formula is CₙH₂ₙ. Examples: C₂H₄ (ethene), C₃H₆ (propene).",
            explanation: "Alkenes: CₙH₂ₙ (one C=C double bond)."
        },
        {
            id: 50,
            question: "Which is a secondary alcohol?",
            options: ["CH₃-CH₂-OH", "CH₃-CH(OH)-CH₃", "(CH₃)₃C-OH", "CH₃-CHO"],
            correct: 1,
            topic: "Organic Chemistry",
            difficulty: "medium",
            theory: "Alcohols are classified by the carbon bearing the -OH group. Primary alcohol has 1 C, secondary has 2 C, tertiary has 3 C. CH₃-CH(OH)-CH₃ has the -OH on a carbon with 2 other carbons attached.",
            explanation: "Secondary alcohol: -OH on C with 2 other carbons attached."
        }
    ],
    test6: [
        {
            id: 51,
            question: "The standard reduction potential for Cu²⁺/Cu is +0.34 V. This means:",
            options: ["Cu is easily oxidized", "Cu²⁺ is easily reduced", "Cu is more reactive than H₂", "Cu is less reactive than H₂"],
            correct: 1,
            topic: "Electrochemistry",
            difficulty: "medium",
            theory: "Positive reduction potential indicates that the species is easily reduced. Cu²⁺ + 2e⁻ → Cu has E° = +0.34 V, indicating Cu²⁺ is easily reduced to Cu.",
            explanation: "Positive E° means easier to reduce. Cu²⁺ readily accepts electrons."
        },
        {
            id: 52,
            question: "Which obeys the octet rule perfectly?",
            options: ["BF₃", "CF₄", "PCl₅", "AlCl₃"],
            correct: 1,
            topic: "Chemical Bonding",
            difficulty: "medium",
            theory: "The octet rule states that atoms tend to have 8 electrons in their valence shell. CF₄ has carbon with 4 bonding pairs (8 electrons around C). BF₃ has 6 electrons around B, PCl₅ has 10 around P.",
            explanation: "CF₄: C has 8 valence electrons (4 bonds) - obeys octet rule."
        },
        {
            id: 53,
            question: "The first ionization energy generally:",
            options: ["Decreases across a period", "Increases across a period", "Remains constant", "Follows no pattern"],
            correct: 1,
            topic: "Periodic Trends",
            difficulty: "easy",
            theory: "First ionization energy increases across a period due to increasing nuclear charge and decreasing atomic radius. It decreases down a group due to increasing atomic size.",
            explanation: "Ionization energy increases left to right across a period."
        },
        {
            id: 54,
            question: "Which is an example of a heterocyclic compound?",
            options: ["Benzene", "Cyclohexane", "Pyridine", "Cyclopropane"],
            correct: 2,
            topic: "Organic Chemistry",
            difficulty: "medium",
            theory: "Heterocyclic compounds are cyclic compounds containing atleast one atom other than carbon in the ring. Pyridine (C₅H₅N) has nitrogen in the ring, making it heterocyclic.",
            explanation: "Pyridine is heterocyclic with nitrogen in the ring."
        },
        {
            id: 55,
            question: "The heat developed when 1 mole of solute dissolves in excess solvent is:",
            options: ["Heat of solvation", "Heat of combustion", "Heat of vaporization", "Heat of fusion"],
            correct: 0,
            topic: "Thermochemistry",
            difficulty: "easy",
            theory: "Heat of solvation (or dissolution) is the enthalpy change when 1 mole of solute dissolves in excess solvent. It can be exothermic or endothermic.",
            explanation: "Heat of solvation is the heat involved in dissolving solute."
        },
        {
            id: 56,
            question: "The coordination number of Cr in [Cr(NH₃)₆]³⁺ is:",
            options: ["3", "6", "9", "12"],
            correct: 1,
            topic: "Coordination Chemistry",
            difficulty: "easy",
            theory: "Coordination number is the number of ligands bonded to the central metal atom. In [Cr(NH₃)₆]³⁺, there are 6 NH₃ ligands bonded to Cr.",
            explanation: "Coordination number = number of ligands = 6."
        },
        {
            id: 57,
            question: "Which statement about resonance is true?",
            options: ["Actual structure alternates between resonance forms", "Actual structure is average of resonance forms", "One resonance form is real", "Cannot determine"],
            correct: 1,
            topic: "Chemical Bonding",
            difficulty: "hard",
            theory: "Resonance structures are different Lewis representations of the same molecule. The actual structure is a hybrid (average) of all valid resonance forms, not any single form.",
            explanation: "Actual structure is resonance hybrid (average of forms)."
        },
        {
            id: 58,
            question: "The hybridization in BeF₂ is:",
            options: ["sp", "sp²", "sp³", "sp³d"],
            correct: 0,
            topic: "Chemical Bonding",
            difficulty: "medium",
            theory: "Be has 2 valence electrons. In BeF₂, it forms 2 bonds with no lone pairs. With 2 electron domains, BeF₂ has sp hybridization and linear geometry.",
            explanation: "BeF₂: 2 electron domains → sp hybridization → linear."
        },
        {
            id: 59,
            question: "Which is most likely to form complexes?",
            options: ["Na⁺", "K⁺", "Zn²⁺", "Ca²⁺"],
            correct: 2,
            topic: "Coordination Chemistry",
            difficulty: "medium",
            theory: "Zn²⁺ is a transition metal ion that readily forms coordination complexes due to its high charge density and ability to accept electron pairs. Alkali metal cations form fewer complexes.",
            explanation: "Zn²⁺ forms many complexes due to its high charge density."
        },
        {
            id: 60,
            question: "The bond angle in PCl₃ is approximately:",
            options: ["90°", "109.5°", "107°", "120°"],
            correct: 2,
            topic: "Molecular Structure",
            difficulty: "medium",
            theory: "PCl₃ has 3 bonding pairs and 1 lone pair on P. VSEPR predicts tetrahedral electron geometry but trigonal pyramidal molecular geometry. Bond angle is approximately 107°, less than 109.5° due to lone pair repulsion.",
            explanation: "PCl₃: 1 lone pair reduces bond angle from 109.5° to ≈107°."
        }
    ],
    test7: [
        {
            id: 61,
            question: "In a displacement reaction, the most reactive metal is:",
            options: ["Copper", "Zinc", "Iron", "Sodium"],
            correct: 3,
            topic: "Reactivity Series",
            difficulty: "easy",
            theory: "The reactivity series arranges metals by their tendency to lose electrons. Sodium is among the most reactive metals, while copper is less reactive. The order is: Na > Zn > Fe > Cu.",
            explanation: "Sodium is more reactive than other options in displacement."
        },
        {
            id: 62,
            question: "The C-C-C bond angle in propane is approximately:",
            options: ["90°", "109.5°", "120°", "180°"],
            correct: 1,
            topic: "Organic Chemistry",
            difficulty: "easy",
            theory: "In propane (CH₃-CH₂-CH₃), the central carbon is sp³ hybridized with tetrahedral geometry. The C-C-C bond angle is approximately 109.5°.",
            explanation: "sp³ hybridization → tetrahedral → C-C-C angle ≈ 109.5°."
        },
        {
            id: 63,
            question: "Which is a polar molecule?",
            options: ["CO₂", "BF₃", "H₂O", "CH₄"],
            correct: 2,
            topic: "Molecular Polarity",
            difficulty: "medium",
            theory: "A molecule is polar when it has a dipole moment. H₂O is bent/angular due to 2 lone pairs on oxygen, resulting in unequal charge distribution and a net dipole moment.",
            explanation: "H₂O is bent → dipole moments don't cancel → polar."
        },
        {
            id: 64,
            question: "The unit of rate constant for a second-order reaction is:",
            options: ["s⁻¹", "M⁻¹s⁻¹", "M⁻²s⁻¹", "Ms⁻¹"],
            correct: 1,
            topic: "Reaction Kinetics",
            difficulty: "hard",
            theory: "For Rate = k[A]², the units are: M/s = k × M². Therefore, k has units M⁻¹s⁻¹.",
            explanation: "For 2nd order: k units are M⁻¹s⁻¹."
        },
        {
            id: 65,
            question: "Which compound is not an isomer of C₃H₆O?",
            options: ["Acetone", "Allyl alcohol", "Propionic acid", "Methyl oxirane"],
            correct: 2,
            topic: "Isomerism",
            difficulty: "hard",
            theory: "Propionic acid has formula C₃H₆O₂ (not C₃H₆O). Acetone (propanone), allyl alcohol (prop-2-en-1-ol), and methyl oxirane all have C₃H₆O.",
            explanation: "Propionic acid is C₃H₆O₂, not C₃H₆O."
        },
        {
            id: 66,
            question: "The noble gas with highest density is:",
            options: ["He", "Ne", "Ar", "Xe"],
            correct: 3,
            topic: "Periodic Table",
            difficulty: "easy",
            theory: "Density generally increases down a group. Among noble gases, Xenon (Xe) has the highest molar mass and thus the highest density.",
            explanation: "Xenon is the heaviest noble gas with highest density."
        },
        {
            id: 67,
            question: "In SN2 reactions, the rate depends on:",
            options: ["[Substrate] only", "[Nucleophile] only", "Both [Substrate] and [Nucleophile]", "None of above"],
            correct: 2,
            topic: "Organic Reaction Mechanisms",
            difficulty: "medium",
            theory: "SN2 (bimolecular nucleophilic substitution) is a one-step process where both substrate and nucleophile are involved. Rate = k[Substrate][Nucleophile].",
            explanation: "SN2 rate = k[RX][Nu⁻], second order overall."
        },
        {
            id: 68,
            question: "The quantum number 'l' determines:",
            options: ["Size of orbital", "Shape of orbital", "Orientation of orbital", "Spin of electron"],
            correct: 1,
            topic: "Atomic Structure",
            difficulty: "medium",
            theory: "The azimuthal quantum number (l) determines the shape of an orbital. l = 0 (s, spherical), l = 1 (p, dumbbell), l = 2 (d, cloverleaf).",
            explanation: "l (azimuthal) determines orbital shape."
        },
        {
            id: 69,
            question: "The mole fraction of solute is:",
            options: ["moles of solute / total moles", "grams of solute / total grams", "molarity × volume", "molality × density"],
            correct: 0,
            topic: "Solution Chemistry",
            difficulty: "medium",
            theory: "Mole fraction (χ) is defined as: χ_solute = n_solute / (n_solute + n_solvent) = n_solute / n_total.",
            explanation: "Mole fraction = moles of solute / total moles."
        },
        {
            id: 70,
            question: "Which has maximum mass number for a given atomic number?",
            options: ["Isotope with most neutrons", "Isotope with most protons", "Most abundant isotope", "Most stable isotope"],
            correct: 0,
            topic: "Nuclear Chemistry",
            difficulty: "medium",
            theory: "Mass number A = protons (Z) + neutrons (N). For a given atomic number (fixed protons), maximum mass comes from maximum neutrons.",
            explanation: "More neutrons → higher mass number for same atomic number."
        }
    ],
    test8: [
        {
            id: 71,
            question: "The pH at which amino acid has no net charge is called:",
            options: ["pKa", "pKb", "pI", "pkw"],
            correct: 2,
            topic: "Biomolecules",
            difficulty: "medium",
            theory: "The isoelectric point (pI) is the pH at which an amino acid has no net electrical charge. At this pH, the positive charge on the amino group equals the negative charge on the carboxyl group.",
            explanation: "pI is isoelectric point where amino acid has no net charge."
        },
        {
            id: 72,
            question: "Which is not affected by temperature?",
            options: ["Reaction rate", "Equilibrium constant", "Density", "Vapor pressure"],
            correct: 2,
            topic: "Physical Chemistry",
            difficulty: "hard",
            theory: "Density depends on atomic/molecular mass and is not significantly affected by temperature and pressure for solids. Reaction rate, equilibrium constant, and vapor pressure all increase with temperature.",
            explanation: "Density is intrinsic property, relatively independent of temperature."
        },
        {
            id: 73,
            question: "The relationship between Kp and Kc is:",
            options: ["Kp = Kc", "Kp = Kc(RT)^Δn", "Kp = Kc/(RT)^Δn", "Kp = Kc + Δn"],
            correct: 1,
            topic: "Equilibrium Chemistry",
            difficulty: "hard",
            theory: "For gas phase reactions: Kp = Kc(RT)^Δn, where Δn = (moles of gaseous products - moles of gaseous reactants).",
            explanation: "Kp = Kc(RT)^Δn relationship for gas reactions."
        },
        {
            id: 74,
            question: "The most electronegative atom in H₂SO₄ is:",
            options: ["S", "O", "H", "Cannot determine"],
            correct: 1,
            topic: "Periodic Table",
            difficulty: "easy",
            theory: "Among S, O, and H in H₂SO₄, oxygen is the most electronegative (O: 3.44, S: 2.58, H: 2.20 on Pauling scale).",
            explanation: "Oxygen is more electronegative than sulfur."
        },
        {
            id: 75,
            question: "Which is a Lewis base?",
            options: ["H⁺", "BF₃", "NH₃", "AlCl₃"],
            correct: 2,
            topic: "Acid-Base Chemistry",
            difficulty: "medium",
            theory: "Lewis base is an electron pair donor. NH₃ has a lone pair on N and can donate it to a Lewis acid. BF₃ and AlCl₃ are electron pair acceptors (Lewis acids).",
            explanation: "NH₃ is Lewis base, donates electron pair."
        },
        {
            id: 76,
            question: "The number of electrons in oxide ion O²⁻ is:",
            options: ["6", "8", "10", "12"],
            correct: 2,
            topic: "Atomic Structure",
            difficulty: "easy",
            theory: "Oxygen has 8 electrons. O²⁻ gains 2 more electrons. Total = 8 + 2 = 10 electrons.",
            explanation: "O (8e⁻) + 2e⁻ → O²⁻ (10e⁻)."
        },
        {
            id: 77,
            question: "Which transition is responsible for UV absorption?",
            options: ["n → σ*", "σ → σ*", "π → π*", "All of above"],
            correct: 3,
            topic: "Spectroscopy",
            difficulty: "hard",
            theory: "UV-Vis absorption involves electronic transitions between molecular orbital levels. Common transitions include n → π*, π → π*, and σ → σ* depending on the wavelength.",
            explanation: "UV absorption from various orbital transitions."
        },
        {
            id: 78,
            question: "Standard enthalpy of formation (ΔH_f°) of an element in standard state is:",
            options: ["Positive", "Negative", "Zero", "Cannot determine"],
            correct: 2,
            topic: "Thermochemistry",
            difficulty: "easy",
            theory: "By definition, the standard enthalpy of formation of an element in its standard state is zero (ΔH_f° = 0). This is the reference point for calculating other enthalpy values.",
            explanation: "ΔH_f° of element in standard state = 0 by definition."
        },
        {
            id: 79,
            question: "Bond order in O₂⁻ is:",
            options: ["1", "1.5", "2", "2.5"],
            correct: 1,
            topic: "Chemical Bonding",
            difficulty: "hard",
            theory: "Using Molecular Orbital Theory: O₂ has bond order 2. O₂⁻ (one more electron) has bond order = (number of bonding e⁻ - number of antibonding e⁻)/2 = (8 - 5)/2 = 1.5.",
            explanation: "O₂⁻ bond order = 1.5."
        },
        {
            id: 80,
            question: "Which exhibits both paramagnetism and ferromagnetism?",
            options: ["Fe", "O₂", "Zn", "Cu"],
            correct: 0,
            topic: "Magnetic Properties",
            difficulty: "hard",
            theory: "Ferromagnetism occurs in Fe, Co, Ni where magnetic moments align. Paramagnetism occurs in substances with unpaired electrons. Fe shows ferromagnetism, and at high temperatures it becomes paramagnetic.",
            explanation: "Fe exhibits strong ferromagnetism."
        }
    ],
    test9: [
        {
            id: 81,
            question: "The Ksp of AgCl is 1.8 × 10⁻¹⁰. The solubility of AgCl is:",
            options: ["1.34 × 10⁻⁵ M", "1.8 × 10⁻¹⁰ M", "4.24 × 10⁻¹¹ M", "Cannot determine"],
            correct: 0,
            topic: "Solubility Equilibria",
            difficulty: "medium",
            theory: "AgCl ⇌ Ag⁺ + Cl⁻. If solubility = s, then [Ag⁺] = [Cl⁻] = s. Ksp = s² = 1.8 × 10⁻¹⁰. s = √(1.8 × 10⁻¹⁰) = 1.34 × 10⁻⁵ M.",
            explanation: "Ksp = s². s = √(1.8 × 10⁻¹⁰) = 1.34 × 10⁻⁵ M."
        },
        {
            id: 82,
            question: "In the transition state theory, the species formed is:",
            options: ["Intermediate", "Activated complex", "Product", "Reactant"],
            correct: 1,
            topic: "Reaction Kinetics",
            difficulty: "medium",
            theory: "Transition state theory proposes an activated complex (transition state) is formed at the peak of the reaction energy diagram. This species is at the highest energy point on the reaction pathway.",
            explanation: "Transition state forms the activated complex."
        },
        {
            id: 83,
            question: "The Van der Waals radius is larger than the covalent radius because:",
            options: ["Electron density is different", "Van der Waals includes intermolecular space", "Different measurement methods", "All of above"],
            correct: 3,
            topic: "Chemical Bonding",
            difficulty: "hard",
            theory: "Covalent radius is half the distance in a covalent bond. Van der Waals radius includes intermolecular distances in crystal structures. Both involve different electron density considerations.",
            explanation: "Van der Waals > covalent radius due to nature of interactions."
        },
        {
            id: 84,
            question: "Which is the most basic oxide?",
            options: ["SiO₂", "Al₂O₃", "Na₂O", "Cl₂O⁷"],
            correct: 2,
            topic: "Periodic Trends",
            difficulty: "medium",
            theory: "Metallic oxides are basic (basic anhydrides), while non-metallic oxides are acidic. Among the options, Na₂O is the oxide of an alkali metal and is the most basic.",
            explanation: "Na₂O is most basic as Na is most metallic."
        },
        {
            id: 85,
            question: "The rate-determining step is:",
            options: ["Fastest step", "Slowest step", "First step", "Last step"],
            correct: 1,
            topic: "Reaction Kinetics",
            difficulty: "easy",
            theory: "The rate-determining step (RDS) is the slowest step in a multi-step reaction mechanism. The overall reaction rate is limited by this slowest step.",
            explanation: "RDS is the slowest elementary step."
        },
        {
            id: 86,
            question: "Which is tetrahedral in shape?",
            options: ["PCl₅", "SF₆", "CCl₄", "AsCl₅"],
            correct: 2,
            topic: "Molecular Geometry",
            difficulty: "easy",
            theory: "CCl₄ has 4 C-Cl bonds and no lone pairs on C. This gives a tetrahedral geometry. PCl₅ is trigonal bipyramidal, SF₆ is octahedral.",
            explanation: "CCl₄: 4 electron domains → tetrahedral."
        },
        {
            id: 87,
            question: "The unit cell of diamond is:",
            options: ["Simple cubic", "Face-centered cubic", "Body-centered cubic", "Hexagonal"],
            correct: 1,
            topic: "Crystal Structure",
            difficulty: "medium",
            theory: "Diamond has a face-centered cubic structure with carbon atoms at faces and corners, with additional atoms inside. This is a very hard and stable structure.",
            explanation: "Diamond crystallizes in FCC lattice."
        },
        {
            id: 88,
            question: "Which statement about diffusion is true?",
            options: ["Occurs faster in solids", "Requires external energy", "Increases with temperature", "Decreases with temperature"],
            correct: 2,
            topic: "Kinetic Theory",
            difficulty: "medium",
            theory: "Diffusion is the movement of molecules from high to low concentration regions. It increases with temperature because molecules have higher kinetic energy and move faster.",
            explanation: "Diffusion rate increases with temperature."
        },
        {
            id: 89,
            question: "The angular momentum quantum number (l) can have values from:",
            options: ["0 to n-1", "0 to n+1", "1 to n", "-l to +l"],
            correct: 0,
            topic: "Atomic Structure",
            difficulty: "medium",
            theory: "For a given principal quantum number n, the angular momentum quantum number l can have values from 0 to (n-1). For example, if n=3, l can be 0, 1, or 2.",
            explanation: "l ranges from 0 to (n-1)."
        },
        {
            id: 90,
            question: "In a galvanic cell, the cell potential E° is:",
            options: ["Always negative", "Always positive", "Can be positive or negative", "Zero"],
            correct: 2,
            topic: "Electrochemistry",
            difficulty: "medium",
            theory: "For a spontaneous galvanic cell, E° = E°(cathode) - E°(anode) must be positive. However, E° can be written as negative if the cell is non-spontaneous under the given conditions.",
            explanation: "E° > 0 for spontaneous galvanic cells."
        }
    ],
    test10: [
        {
            id: 91,
            question: "The set of quantum numbers (3, 1, 0, +1/2) is:",
            options: ["Valid", "Invalid (l too large)", "Invalid (ml out of range)", "Invalid (ms not allowed)"],
            correct: 2,
            topic: "Atomic Structure",
            difficulty: "hard",
            theory: "n=3, l=1 is valid. For l=1, ml can be -1, 0, +1. Given ml=0 is within range. But ms=+1/2 is valid. The set appears valid. (Note: If ml=0 is ml range then valid)",
            explanation: "n=3, l=1 is valid. ml ranges from -1 to +1."
        },
        {
            id: 92,
            question: "The ionization of water is:",
            options: ["Endothermic", "Exothermic", "Isothermal", "Neither"],
            correct: 0,
            topic: "Acid-Base Equilibria",
            difficulty: "medium",
            theory: "The ionization of water (H₂O ⇌ H⁺ + OH⁻) is endothermic, meaning it requires energy. The ionic product Kw increases with temperature.",
            explanation: "Water ionization is endothermic (requires energy)."
        },
        {
            id: 93,
            question: "Which hybridization gives a linear geometry?",
            options: ["sp", "sp²", "sp³", "sp³d"],
            correct: 0,
            topic: "Chemical Bonding",
            difficulty: "easy",
            theory: "sp hybridization produces 2 hybrid orbitals at 180° angle, giving a linear geometry. Examples: BeF₂, CO₂.",
            explanation: "sp hybridization → linear geometry (180°)."
        },
        {
            id: 94,
            question: "The quantum mechanics principle of uncertainty applies primarily to:",
            options: ["Macroscopic objects", "Microscopic particles", "Both equally", "Only gases"],
            correct: 1,
            topic: "Quantum Mechanics",
            difficulty: "medium",
            theory: "The Heisenberg uncertainty principle applies to microscopic particles like electrons and photons where quantum effects dominate. It has negligible effect on macroscopic objects.",
            explanation: "Uncertainty principle significant for microscopic particles."
        },
        {
            id: 95,
            question: "Orange chromate is converted to yellow dichromate in acidic conditions. This is:",
            options: ["Endothermic reaction", "Reversible reaction", "Oxidation-reduction", "Ion exchange"],
            correct: 1,
            topic: "Redox Chemistry",
            difficulty: "medium",
            theory: "The interconversion between CrO₄²⁻ (yellow) and Cr₂O₇²⁻ (orange) in different pH is a reversible equilibrium: 2CrO₄²⁻ + 2H⁺ ⇌ Cr₂O₇²⁻ + H₂O.",
            explanation: "CrO₄²⁻ ⇌ Cr₂O₇²⁻ equilibrium depending on pH."
        },
        {
            id: 96,
            question: "Carbon forms 4 covalent bonds due to its:",
            options: ["Atomic number", "Valence electrons", "Covalent radius", "Electronegativity"],
            correct: 1,
            topic: "Chemical Bonding",
            difficulty: "easy",
            theory: "Carbon has 4 valence electrons (2s²2p²). It forms 4 covalent bonds by sharing these 4 electrons with other atoms.",
            explanation: "Carbon has 4 valence electrons → forms 4 bonds."
        },
        {
            id: 97,
            question: "The substance which increases the rate of reaction is:",
            options: ["Inhibitor", "Catalyst", "Moderator", "Suppressant"],
            correct: 1,
            topic: "Catalysis",
            difficulty: "easy",
            theory: "A catalyst is a substance that increases the reaction rate by lowering activation energy. It is not consumed in the reaction.",
            explanation: "Catalyst increases reaction rate without being consumed."
        },
        {
            id: 98,
            question: "In an exothermic reaction:",
            options: ["ΔH > 0", "ΔH < 0", "ΔH = 0", "ΔH depends on conditions"],
            correct: 1,
            topic: "Thermochemistry",
            difficulty: "easy",
            theory: "Exothermic reactions release heat. By convention, ΔH is negative for exothermic reactions (ΔH < 0).",
            explanation: "Exothermic: ΔH < 0 (negative)."
        },
        {
            id: 99,
            question: "The C-H bond is polar or nonpolar?",
            options: ["Polar", "Nonpolar", "Slightly polar", "Depends on compound"],
            correct: 2,
            topic: "Chemical Bonding",
            difficulty: "medium",
            theory: "The electronegativity difference between C (2.55) and H (2.20) is small (0.35), making C-H bonds slightly polar. However, they are often considered nonpolar for practical purposes.",
            explanation: "C-H bond is slightly polar due to small electronegativity difference."
        },
        {
            id: 100,
            question: "The order of reactivity for halogens is:",
            options: ["Cl₂ > Br₂ > F₂ > I₂", "F₂ > Cl₂ > Br₂ > I₂", "I₂ > Br₂ > Cl₂ > F₂", "Br₂ > Cl₂ > F₂ > I₂"],
            correct: 1,
            topic: "Periodic Trends",
            difficulty: "medium",
            theory: "Halogen reactivity decreases down the group: F₂ > Cl₂ > Br₂ > I₂. Fluorine is the most reactive nonmetal due to high electronegativity and small size.",
            explanation: "Halogen reactivity: F₂ > Cl₂ > Br₂ > I₂."
        }
    ]
};

module.exports = { jeeChemistryQuestions };
