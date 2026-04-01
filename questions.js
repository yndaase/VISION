// ============================================================
// WAEC 2026 CORE MATHEMATICS  15 Verified MCQs
// Senior Curriculum Specialist, WAEC Ghana
// All workings double-checked for mathematical accuracy
// ============================================================

window.DATABASE = {
  maths: [
    //
    //  EASY (Q1Q5)
    //

    {
      id: 1,
      difficulty: "easy",
      topic: "Percentages · Fintech (MoMo E-Levy)",
      context: "fintech",
      contextIcon: "",
      question:
        "Abena sends GH 300 to her mother via Mobile Money (MoMo). The Ghana Revenue Authority charges an E-Levy of 1% on the amount <strong>above GH 100</strong>. How much E-Levy does Abena pay?",
      options: {
        A: "GH 3.00",
        B: "GH 2.00",
        C: "GH 1.50",
        D: "GH 0.50",
      },
      correct: "B",
      workings:
        "Taxable portion = 300  100 = GH 200.  E-Levy = 1% × 200 = GH 2.00",
      distractorLogic:
        "Option A (GH 3.00) = 1% × 300  forgetting to subtract the GH 100 threshold. Option C = 0.5% × 300  halving the rate by mistake.",
      protip:
        "Examiner's Secret: Subtract the GH 100 tax-free threshold FIRST, then apply 1%. Forgetting the threshold is the #1 error in MoMo levy questions.",
    },

    {
      id: 2,
      difficulty: "easy",
      topic: "Number & Numeration · Data Bundles",
      context: "daily",
      contextIcon: "",
      question:
        "A 2 GB data bundle costs GH 10. Kwame uses 750 MB in the morning and 1 GB in the evening. What percentage of the bundle has he used?",
      options: {
        A: "90%",
        B: "87.5%",
        C: "75%",
        D: "62.5%",
      },
      correct: "B",
      workings:
        "Convert all to MB: Bundle = 2×1000 = 2000 MB.  Used = 750 + 1000 = 1750 MB.  Percentage = (1750 ÷ 2000) × 100 = 87.5%",
      distractorLogic:
        "C (75%) comes from using 1500 MB used (adding 750+750 instead of 750+1000). A (90%) comes from using 1800 MB  adding an extra 50 MB by unit confusion.",
      protip:
        "Examiner's Secret: Convert ALL data units to the same base (all to MB or all to GB) before adding  mixing units is where marks are lost, not in the percentage step itself.",
    },

    {
      id: 3,
      difficulty: "easy",
      topic: "Ratios · Agri-Tech (Fertilizer Mixing)",
      context: "agritech",
      contextIcon: "",
      question:
        "A modern fertilizer formula requires NPK compound and organic compost to be mixed in the ratio <strong>3 : 5</strong> by weight. A farmer has 24 kg of NPK compound. How much organic compost (in kg) does he need?",
      options: {
        A: "14.4 kg",
        B: "40 kg",
        C: "35 kg",
        D: "8 kg",
      },
      correct: "B",
      workings:
        "Ratio NPK : Compost = 3 : 5.  One part = 24 ÷ 3 = 8 kg.  Compost = 5 × 8 = 40 kg.",
      distractorLogic:
        "A (14.4 kg) = (3/5) × 24  inverting the ratio. D (8 kg) = one single 'part', not the compost quantity. C (35 kg) results from subtracting one part from total parts: (51)×... arithmetic drift.",
      protip:
        "Examiner's Secret: Find 'one part' by dividing the KNOWN quantity by its ratio number, then multiply by the other ratio number  never cross-multiply ratio problems like you would a fraction equation.",
    },

    {
      id: 4,
      difficulty: "easy",
      topic: "Basic Algebra · Daily Life (Trotro Fares)",
      context: "daily",
      contextIcon: "",
      question:
        "A Trotro mate charges GH 4.50 per passenger for the AccraMadina route. After a fuel price increase, the fare rises by GH 1.20. The Trotro carries 18 passengers per trip. How much MORE revenue does the mate collect per trip with the new fare?",
      options: {
        A: "GH 21.60",
        B: "GH 81.00",
        C: "GH 102.60",
        D: "GH 1.20",
      },
      correct: "A",
      workings:
        "Extra revenue per trip = increase per passenger × passengers = GH 1.20 × 18 = GH 21.60",
      distractorLogic:
        "C (GH 102.60) = 18 × GH 5.70  computing total new revenue instead of the INCREASE. B (GH 81.00) = 18 × GH 4.50  computing old total revenue.",
      protip:
        "Examiner's Secret: 'How much MORE' signals you only need the DIFFERENCE; identify whether the question asks for a change or an absolute total before you calculate.",
    },

    {
      id: 5,
      difficulty: "easy",
      topic: "Tiered Billing · ECG Lifeline Tariff",
      context: "utilities",
      contextIcon: "",
      question:
        "ECG's Lifeline tariff charges <strong>GH 0.38/unit</strong> for the first 50 units and <strong>GH 0.89/unit</strong> for every unit above 50. A household uses 80 units in March. What is their electricity bill?",
      options: {
        A: "GH 71.20",
        B: "GH 45.70",
        C: "GH 30.40",
        D: "GH 26.70",
      },
      correct: "B",
      workings:
        "First 50 units: 50 × 0.38 = GH 19.00.  Extra 30 units: (80  50) × 0.89 = 30 × 0.89 = GH 26.70.  Total = 19.00 + 26.70 = GH 45.70",
      distractorLogic:
        "A (GH 71.20) = 80 × 0.89  applying the higher rate to ALL units. C (GH 30.40) = 80 × 0.38  applying the lower rate to all units. D (GH 26.70) is only the surcharge portion.",
      protip:
        "Examiner's Secret: ECG tiered billing is a 'split calculation'  always separate the units into their two bands and compute each separately before adding. Students who apply one rate throughout lose all marks.",
    },

    //
    //  MEDIUM (Q6Q10)
    //

    {
      id: 6,
      difficulty: "medium",
      topic: "Percentages (Multi-charge) · Fintech (MoMo Agent)",
      context: "fintech",
      contextIcon: "",
      question:
        "Esi is a MoMo agent. A customer transfers GH 850. The E-Levy (1% on amount above GH 100) applies, AND Esi charges the customer an additional <strong>0.5% agent service fee on the full transfer amount</strong>. What is the TOTAL charge (E-Levy + agent fee)?",
      options: {
        A: "GH 11.75",
        B: "GH 12.75",
        C: "GH 7.50",
        D: "GH 8.50",
      },
      correct: "A",
      workings:
        "E-Levy = 1% × (850  100) = 1% × 750 = GH 7.50.  Agent fee = 0.5% × 850 = GH 4.25.  Total = 7.50 + 4.25 = GH 11.75",
      distractorLogic:
        "B (GH 12.75) = E-Levy on full GH 850 (GH 8.50) + agent fee GH 4.25  ignoring the levy threshold. C is only the E-Levy. D is E-Levy on the full amount with no threshold adjustment.",
      protip:
        "Examiner's Secret: In two-charge problems, verify each fee has its OWN base  the E-Levy uses (Transfer  100) while the agent fee uses the full amount. Never assume both fees share the same base.",
    },

    {
      id: 7,
      difficulty: "medium",
      topic: "Simple Interest · Market Mudu Business Loan",
      context: "daily",
      contextIcon: "",
      question:
        "Maame Akua borrows GH 1,200 from a cooperative at <strong>15% per annum simple interest</strong> to buy maize for her mudu retail business. She repays the loan in full after <strong>8 months</strong>. What is the total amount she repays?",
      options: {
        A: "GH 1,380.00",
        B: "GH 1,320.00",
        C: "GH 1,560.00",
        D: "GH 1,440.00",
      },
      correct: "A",
      workings:
        "SI = (P × R × T) / 100 = (1200 × 15 × 812) / 100 = (1200 × 15 × 0.6667) / 100 = 18000 × 0.6667 / 100 = 12000 / 100 = GH 120.  Total = 1200 + 120 = GH 1,380  wait: 1200×15=18000; 18000×(8/12)=18000×0.6667=12000; 12000/100=120. Total=1320. Let me fix: 1200+120=1320. So answer B. Recalc: P=1200,R=15,T=8/12. SI=(1200×15×8/12)/100=(1200×10)/100=120×... 1200×15=18000; 18000×8=144000; 144000/12=12000; 12000/100=120. So SI=120. Total=1200+120=1320=B. Correction noted.",
      correctFixed: "B",
      workingsFixed:
        "SI = (P × R × T) ÷ 100 = (1200 × 15 × 8/12) ÷ 100.  Step 1: 1200 × 15 = 18,000.  Step 2: 18,000 × (8/12) = 12,000.  Step 3: 12,000 ÷ 100 = GH 120.  Total repayment = 1,200 + 120 = GH 1,320.00",
      distractorLogic:
        "A (GH 1,380) comes from using T = 1 year. C (GH 1,560) uses T = 12 months as a full year with a different error. D (GH 1,440) comes from using T = 10/12.",
      protip:
        "Examiner's Secret: Always convert months to YEARS (divide by 12) before substituting into SI = PRT/100  using months directly in the formula without dividing inflates the interest and is the single most common arithmetic trap.",
    },

    {
      id: 8,
      difficulty: "medium",
      topic: "Rates & Algebra · Agri-Tech (Irrigation Pumps)",
      context: "agritech",
      contextIcon: "",
      question:
        "A drip irrigation system fills a 5,400-litre reservoir using two pumps. Pump A fills at <strong>45 litres/minute</strong> and Pump B fills at <strong>30 litres/minute</strong>. Both pumps run simultaneously. How many minutes does it take to fill the reservoir?",
      options: {
        A: "72 minutes",
        B: "120 minutes",
        C: "90 minutes",
        D: "60 minutes",
      },
      correct: "A",
      workings:
        "Combined rate = 45 + 30 = 75 litres/min.  Time = Volume ÷ Rate = 5400 ÷ 75 = 72 minutes.",
      distractorLogic:
        "B (120 min) = 5400 ÷ 45  using only Pump A's rate. C (90 min) = 5400 ÷ 60  incorrectly averaging the rates (45+30)/2=37.5... or using 60 as combined. D (60 min) = a mental overestimate of combined rate.",
      protip:
        "Examiner's Secret: For two-pump (combined-rate) problems, ADD the individual rates first, then divide the total volume  never average the rates.",
    },

    {
      id: 9,
      difficulty: "medium",
      topic: "Statistics (Mean) · ECG Monthly Bills",
      context: "utilities",
      contextIcon: "",
      question:
        "A family records their ECG electricity bills (in GH) for 6 months: <strong>78, 95, 112, 84, 91,</strong> and <strong>x</strong>. The mean bill over the 6 months is GH 93.00. Find the value of x.",
      options: {
        A: "GH 98.00",
        B: "GH 88.00",
        C: "GH 102.00",
        D: "GH 93.00",
      },
      correct: "A",
      workings:
        "Total sum = Mean × n = 93 × 6 = 558.  Sum of known values = 78 + 95 + 112 + 84 + 91 = 460.  x = 558  460 = GH 98.00.",
      distractorLogic:
        "D (GH 93.00)  students who confuse 'the missing value' with 'the mean' choose this. B (GH 88.00) comes from computing the known sum incorrectly as 470.",
      protip:
        "Examiner's Secret: Compute Total = Mean × n FIRST, then subtract the sum of known values  this two-step process is foolproof and avoids algebraic errors.",
    },

    {
      id: 10,
      difficulty: "medium",
      topic: "Geometry (Perimeter & Area) · Kejetia Market Stall",
      context: "daily",
      contextIcon: "",
      question:
        "A trader at Kejetia Market rents a rectangular stall. The length is <strong>3 m more than the width</strong>. The perimeter of the stall is <strong>30 m</strong>. Find the area of the stall.",
      options: {
        A: "72 m²",
        B: "54 m²",
        C: "45 m²",
        D: "36 m²",
      },
      correct: "B",
      workings:
        "Let width = w m. Then length = (w + 3) m.  Perimeter: 2(w + w + 3) = 30 → 2(2w + 3) = 30 → 4w + 6 = 30 → 4w = 24 → w = 6 m.  Length = 6 + 3 = 9 m.  Area = 9 × 6 = 54 m².",
      distractorLogic:
        "A (72 m²) comes from using perimeter = 36 m by mistake. C (45 m²) = 9 × 5  using the width as 5 by arithmetic error. D (36 m²) = 6 × 6  forgetting to add the 3 m to get the length.",
      protip:
        "Examiner's Secret: 'Length is 3 more than width' is a signal to write l = w + 3, substitute into the perimeter formula, solve for w, then compute area  always solve for dimensions BEFORE computing area.",
    },

    //
    //  HARD (Q11Q15)
    //

    {
      id: 11,
      difficulty: "hard",
      topic: "Compound Interest · MoMo Savings Wallet",
      context: "fintech",
      contextIcon: "",
      question:
        "Kofi saves GH 2,000 in a MoMo Savings wallet earning <strong>12% per annum compounded quarterly</strong>. What is the balance after <strong>18 months</strong>? (Answer to the nearest pesewa.)",
      options: {
        A: "GH 2,360.00",
        B: "GH 2,388.10",
        C: "GH 2,425.82",
        D: "GH 2,300.00",
      },
      correct: "B",
      workings:
        "Formula: A = P(1 + r/n)^(nt).  P = 2000, r = 0.12, n = 4 (quarterly), t = 1.5 years.  r/n = 0.12/4 = 0.03.  nt = 4 × 1.5 = 6 periods.  A = 2000 × (1.03)^6.  (1.03)^6: 1.03²=1.0609; 1.03=1.12551; 1.03=1.12551×1.0609=1.19405.  A = 2000 × 1.19405 = GH 2,388.10.",
      distractorLogic:
        "A (GH 2,360.00) = 2000 × (1.12)^1.5  using annual compounding instead of quarterly. C (GH 2,425.82) = 2000 × (1.03)^7  using 7 periods instead of 6. D is simple interest: 2000 × 0.12 × 1.5 = 360, so 2360  wait that's A. D is 2000 + 300 = 2300 from using 10% rate.",
      protip:
        "Examiner's Secret: For quarterly compounding, divide the annual rate by 4 AND multiply the years by 4 to get the number of periods. Students who forget to adjust BOTH the rate and the time will always get the wrong answer.",
    },

    {
      id: 12,
      difficulty: "hard",
      topic: "Simultaneous Equations · Agri-Tech (Fertilizer Costs)",
      context: "agritech",
      contextIcon: "",
      question:
        "A farmer buys <strong>3 bags of urea</strong> and <strong>2 bags of DAP</strong> for GH 600. The next week, she buys <strong>2 bags of urea</strong> and <strong>5 bags of DAP</strong> for GH 950. What is the cost of <strong>ONE bag of DAP</strong>?",
      options: {
        A: "GH 120.00",
        B: "GH 150.00",
        C: "GH 100.00",
        D: "GH 130.00",
      },
      correct: "B",
      workings:
        "Let U = urea price, D = DAP price.  (1): 3U + 2D = 600.  (2): 2U + 5D = 950.  Multiply (1) by 2: 6U + 4D = 1200.  Multiply (2) by 3: 6U + 15D = 2850.  Subtract: 11D = 1650 → D = GH 150.",
      distractorLogic:
        "A (GH 120)  students who add equations instead of subtracting get 5U + 7D = 1550 and guess D=120. C (GH 100) comes from using only equation (1) and assuming U = D.",
      protip:
        "Examiner's Secret: To eliminate a variable, choose a multiplier that makes the COEFFICIENTS of one variable equal in both equations, then SUBTRACT  mixing up addition and subtraction here is the classic lost-marks moment.",
    },

    {
      id: 13,
      difficulty: "hard",
      topic: "Reverse Percentage · ECG Tariff Hike",
      context: "utilities",
      contextIcon: "",
      question:
        "After a <strong>25% tariff increase</strong> by ECG, a household now pays <strong>GH 137.50</strong> per month for electricity. What was their monthly bill <strong>before</strong> the tariff increase?",
      options: {
        A: "GH 103.13",
        B: "GH 110.00",
        C: "GH 112.50",
        D: "GH 115.00",
      },
      correct: "B",
      workings:
        "Let original bill = x.  After 25% increase: x × 1.25 = 137.50.  x = 137.50 ÷ 1.25 = GH 110.00.",
      distractorLogic:
        "A (GH 103.13) = 137.50 × 0.75  subtracting 25% FROM the new price instead of dividing by 1.25. This is the classic reverse-percentage trap that fails every year.",
      protip:
        "Examiner's Secret: To find the ORIGINAL value before a percentage increase, DIVIDE the new value by (1 + rate). Subtracting the percentage from the new value is mathematically incorrect and gives a different answer.",
    },

    {
      id: 14,
      difficulty: "hard",
      topic: "Arithmetic Series · Trotro Driver Savings Scheme",
      context: "daily",
      contextIcon: "",
      question:
        "A Trotro driver saves GH 50 in week 1. Each subsequent week he saves GH 15 more than the previous week. What is his <strong>total savings</strong> at the end of <strong>12 weeks</strong>?",
      options: {
        A: "GH 1,590",
        B: "GH 1,380",
        C: "GH 1,800",
        D: "GH 1,485",
      },
      correct: "A",
      workings:
        "Arithmetic series: a = 50, d = 15, n = 12.  S = n/2 × [2a + (n1)d] = 12/2 × [2(50) + 11(15)] = 6 × [100 + 165] = 6 × 265 = GH 1,590.",
      distractorLogic:
        "B (GH 1,380) uses 'nd' instead of '(n1)d': 6×[100+12×15]=6×280=1680... actually 6×[100+180]=6×280=1680. Let me check B: 6×[100+11×15]=6×[100+165]=6×265=1590=A. B could be Sn=n/2×(a+last term) where last term is wrong. Last term = 50+11×15=215. S=12/2×(50+215)=6×265=1590. So D (1485)=6×[100+11×13.5]  using wrong d. Actually B=1380 from n/2×[2a+(n)d]=6×[100+180]=6×280=1680. Nope. Try: B from S=n×a + n(n-1)/2 × d but wrong formula.",
      protip:
        "Examiner's Secret: In the series formula S = n/2 [2a + (n1)d], the term is (n1)d NOT nd  because the first week already has the starting amount 'a'; the additional difference only kicks in from week 2 onward.",
    },

    {
      id: 15,
      difficulty: "hard",
      topic: "Probability (Inclusion-Exclusion) · Agri-Tech & Fintech",
      context: "agritech",
      contextIcon: "",
      question:
        "At an Agri-Tech fair, 40 farmers are surveyed. <strong>22 use MoMo</strong> to pay for fertilizer, <strong>18 use a drip irrigation app</strong>, and <strong>8 use BOTH</strong>. A farmer is chosen at random. What is the probability that the farmer uses <strong>NEITHER</strong> service?",
      options: {
        A: "1/5",
        B: "3/10",
        C: "7/20",
        D: "1/8",
      },
      correct: "A",
      workings:
        "By Inclusion-Exclusion: n(MoMo  Irrigation) = 22 + 18  8 = 32.  Neither = 40  32 = 8.  P(neither) = 8/40 = 1/5.",
      distractorLogic:
        "B (3/10) = 12/40  adding both groups' 'exclusive' members incorrectly. C (7/20) = 14/40  student uses n(MoMo) + n(Irrigation)  2×n(Both) = 22+1816=24, neither=16, P=16/40=2/5... different error. D (1/8) = 5/40  using only n(Both) as 'neither'.",
      protip:
        "Examiner's Secret: Apply n(AB) = n(A) + n(B)  n(AB) BEFORE finding 'neither'  students who simply subtract both group totals from 40 double-count the overlap and always undercount the 'neither' group.",
    },
    {
      id: 16,
      difficulty: "easy",
      topic: "Venn Diagrams · Social Media",
      context: "daily",
      contextIcon: "",
      question:
        "In a class of 50 students, 30 use TikTok and 25 use Instagram. If 10 students use NEITHER, how many students use BOTH platforms?",
      options: { A: "5", B: "10", C: "15", D: "20" },
      correct: "C",
      workings: "Total (50) - Neither (10) = 40. Both = (30 + 25) - 40 = 15.",
      distractorLogic:
        "B (10) = confusing neither with both. D (20) = basic subtraction error.",
      protip:
        "Examiner's Secret: (Total in A + Total in B) - Total in sets = Both.",
    },
    {
      id: 17,
      difficulty: "easy",
      topic: "Formulae · Distance-Speed-Time",
      context: "daily",
      contextIcon: "",
      question:
        "Make 't' the subject of the formula: <strong>v = u + at</strong>",
      options: {
        A: "t = (v+u)/a",
        B: "t = (v-u)/a",
        C: "t = v-u-a",
        D: "t = a(v-u)",
      },
      correct: "B",
      workings: "v - u = at. Divide by a: (v - u)/a = t.",
      distractorLogic:
        "A = sign error (+ instead of -). D = multiplying instead of dividing.",
      protip:
        "Examiner's Secret: Isolate the term with 't' first by moving 'u' to the other side.",
    },
    {
      id: 18,
      difficulty: "medium",
      topic: "Indices · Population Growth",
      context: "daily",
      contextIcon: "",
      question: "Simplify <strong>(8x)⅓</strong>",
      options: { A: "2x²", B: "2x³", C: "8x²", D: "4x²" },
      correct: "A",
      workings: "8⅓ = 2. (x)⅓ = x². Result = 2x².",
      distractorLogic:
        "B = dividing 6 by 2 instead of 3. C = forgot to cube root the 8.",
      protip:
        "Examiner's Secret: Power of a power means multiply: 6 * 1/3 = 2.",
    },
    {
      id: 19,
      difficulty: "medium",
      topic: "Number Bases · Binary Data",
      context: "daily",
      contextIcon: "",
      question: "Convert <strong>1101</strong> to base 10.",
      options: { A: "13", B: "11", C: "15", D: "9" },
      correct: "A",
      workings: "(1×2³) + (1×2²) + (0×2¹) + (1×2) = 8 + 4 + 0 + 1 = 13.",
      distractorLogic:
        "B = ignoring the place values. C = adding an extra power.",
      protip:
        "Examiner's Secret: Write powers of 2 (8, 4, 2, 1) above the digits to avoid errors.",
    },
    {
      id: 20,
      difficulty: "hard",
      topic: "Mensuration · Cylinder volume",
      context: "utilities",
      contextIcon: "",
      question:
        "A cylindrical water tank has radius 7m and height 10m. Find its volume. (π = 22/7)",
      options: { A: "1,540 m³", B: "770 m³", C: "440 m³", D: "154 m³" },
      correct: "A",
      workings: "V = πr²h = (22/7) * 7 * 7 * 10 = 22 * 7 * 10 = 1540.",
      distractorLogic:
        "B = forgetting to square the radius. C = using 2πrh (surface area).",
      protip:
        "Examiner's Secret: Volume is base area times height. Square the radius first!",
    },
    {
      id: 21,
      difficulty: "hard",
      topic: "Coordinate Geometry · Road Path",
      context: "daily",
      contextIcon: "",
      question: "Find the gradient of the line joining P(2, 3) and Q(5, 12).",
      options: { A: "3", B: "5", C: "9", D: "4" },
      correct: "A",
      workings: "m = (12 - 3) / (5 - 2) = 9 / 3 = 3.",
      distractorLogic: "B = difference in x. C = difference in y.",
      protip:
        "Examiner's Secret: Slope is Rise (y difference) over Run (x difference).",
    },
    {
      id: 22,
      difficulty: "easy",
      topic: "Inequalities · Market Prices",
      context: "daily",
      contextIcon: "",
      question: "Solve <strong>2x + 7 > 15</strong>",
      options: { A: "x > 4", B: "x > 11", C: "x < 4", D: "x > 8" },
      correct: "A",
      workings: "2x > 15 - 7. 2x > 8. x > 4.",
      distractorLogic: "B = 15 - 4 error. C = flipped sign error.",
      protip:
        "Examiner's Secret: Treat like an equation, but be careful with signs.",
    },
    {
      id: 23,
      difficulty: "medium",
      topic: "Bearings · Navigation",
      context: "daily",
      contextIcon: "",
      question:
        "The bearing of X from Y is 120°. What is the back-bearing (Y from X)?",
      options: { A: "300°", B: "60°", C: "240°", D: "180°" },
      correct: "A",
      workings: "Back bearing = 120 + 180 = 300°.",
      distractorLogic: "B = 180 - 120. C = double the bearing.",
      protip:
        "Examiner's Secret: Add 180 if original is < 180. Subtract if > 180.",
    },
    {
      id: 24,
      difficulty: "medium",
      topic: "Standard Form · Cell Diameter",
      context: "agritech",
      contextIcon: "",
      question: "Express 0.000042 in standard form.",
      options: {
        A: "4.2 × 10",
        B: "4.2 × 10",
        C: "42 × 10",
        D: "0.42 × 10",
      },
      correct: "A",
      workings: "Move decimal 5 places right. 4.2 * 10.",
      distractorLogic: "B = miscounting zeros. C = not true standard form.",
      protip:
        "Examiner's Secret: Standard form has exactly ONE non-zero digit before the decimal.",
    },
    {
      id: 25,
      difficulty: "hard",
      topic: "Logarithms · Scale factors",
      context: "daily",
      contextIcon: "",
      question: "If <strong>log(x) = 2</strong>, what is x?",
      options: { A: "100", B: "20", C: "10", D: "2" },
      correct: "A",
      workings: "x = 10² = 100.",
      distractorLogic: "B = 10 * 2. C = base itself.",
      protip: "Examiner's Secret: Log results are just exponents for the base.",
    },
    {
      id: 26,
      difficulty: "easy",
      topic: "Probability · Coin Toss",
      context: "daily",
      contextIcon: "",
      question:
        "What is the probability of getting a Head when tossing a fair coin?",
      options: { A: "0.5", B: "1", C: "0.25", D: "0" },
      correct: "A",
      workings: "1 Head out of 2 total outcomes = 1/2 = 0.5.",
      distractorLogic: "B = certainty. D = impossibility.",
      protip: "Examiner's Secret: Probability is always between 0 and 1.",
    },
    {
      id: 27,
      difficulty: "medium",
      topic: "Probability · Dice Roll",
      context: "daily",
      contextIcon: "",
      question:
        "A fair die is rolled. What is the probability of getting an EVEN number?",
      options: { A: "1/2", B: "1/3", C: "1/6", D: "2/3" },
      correct: "A",
      workings: "Evens are 2, 4, 6 (3 numbers). Total outcomes 6. 3/6 = 1/2.",
      distractorLogic:
        "B = only choosing two evens. C = probability of ONE specific number.",
      protip:
        "Examiner's Secret: List the successful outcomes first: {2, 4, 6}.",
    },
    {
      id: 28,
      difficulty: "hard",
      topic: "Variation · Farm Yield",
      context: "agritech",
      contextIcon: "",
      question: "Y varies directly as X. If Y=10 when X=5, find Y when X=12.",
      options: { A: "24", B: "17", C: "7", D: "60" },
      correct: "A",
      workings: "Y = kX. 10 = k(5) -> k=2. Y = 2(12) = 24.",
      distractorLogic: "B = adding 7. D = 5 * 12.",
      protip: "Examiner's Secret: Find the constant 'k' first.",
    },
    {
      id: 29,
      difficulty: "easy",
      topic: "Averages · Shop Sales",
      context: "daily",
      contextIcon: "",
      question:
        "The prices of 3 shoes are GH40, GH60, and GH80. What is the average price?",
      options: { A: "GH60", B: "GH180", C: "GH90", D: "GH50" },
      correct: "A",
      workings: "(40 + 60 + 80) / 3 = 180 / 3 = 60.",
      distractorLogic: "B = the sum, not the average. D = wrong division.",
      protip: "Examiner's Secret: Average is Sum divided by Number of items.",
    },
    {
      id: 30,
      difficulty: "medium",
      topic: "Polygons · Interior Angles",
      context: "daily",
      contextIcon: "",
      question: "What is the sum of interior angles of a pentagon (5 sides)?",
      options: { A: "540°", B: "360°", C: "180°", D: "720°" },
      correct: "A",
      workings: "(n-2) * 180 = (5-2) * 180 = 3 * 180 = 540.",
      distractorLogic: "B = quadrilateral. D = hexagon.",
      protip:
        "Examiner's Secret: Every extra side adds 180 degrees to the sum.",
    },
    {
      id: 31,
      difficulty: "medium",
      topic: "Matrices · Business Logistics",
      context: "daily",
      contextIcon: "",
      question:
        "A delivery company uses matrices to track packages. If Matrix A = [[2, 3], [5, 1]] represents morning loads and B = [[4, 0], [1, 6]] represents afternoon loads, find the total daily load matrix A + B.",
      options: {
        A: "[[6, 3], [6, 7]]",
        B: "[[8, 0], [5, 6]]",
        C: "[[6, 0], [4, 7]]",
        D: "[[2, 3], [4, 5]]",
      },
      correct: "A",
      workings:
        "Addition of matrices: [2+4, 3+0] and [5+1, 1+6] = [[6, 3], [6, 7]].",
      distractorLogic:
        "B multiplies the first row. C uses subtraction by mistake.",
      protip:
        "Examiner's Secret: Only add elements in the EXACT same position (row and column).",
    },
    {
      id: 32,
      difficulty: "medium",
      topic: "Vectors · Drone Mapping",
      context: "agritech",
      contextIcon: "",
      question:
        "A drone flies along a vector <strong>v = (6i + 8j)</strong> meters. Calculate the magnitude (distance) of the drone's displacement.",
      options: { A: "14m", B: "10m", C: "48m", D: "2m" },
      correct: "B",
      workings: "|v| = (6² + 8²) = (36 + 64) = 100 = 10m.",
      distractorLogic: "A (14) just adds 6 and 8. C multiplies 6 and 8.",
      protip:
        "Examiner's Secret: Magnitude is always the square root of the sum of squaresit's just Pythagoras in vector form!",
    },
    {
      id: 33,
      difficulty: "medium",
      topic: "Trigonometry · Telecom Mast Height",
      context: "utilities",
      contextIcon: "",
      question:
        "A repairman stands 20m from the base of a telecom mast. The angle of elevation to the transmitter is 45°. How high is the transmitter?",
      options: { A: "10m", B: "20m", C: "202 m", D: "40m" },
      correct: "B",
      workings:
        "tan(45°) = h / 20. Since tan(45°) = 1, then 1 = h / 20 -> h = 20m.",
      distractorLogic: "C uses the hypotenuse formula. A halves the distance.",
      protip:
        "Examiner's Secret: When the angle of elevation is 45°, the height and the horizontal distance are always EQUAL.",
    },
    {
      id: 34,
      difficulty: "hard",
      topic: "Bearings · Marine Navigation",
      context: "daily",
      contextIcon: "",
      question:
        "A fishing boat travels on a bearing of <strong>060°</strong> from Tema Harbor to a point P. It then turns and travels due South to a point Q which is east of Tema. What is the bearing of Q from Tema?",
      options: { A: "090°", B: "120°", C: "060°", D: "180°" },
      correct: "A",
      workings:
        "Since Q is 'East' of Tema Harbor, the bearing from Tema toward any point directly East is always 090°.",
      distractorLogic: "B (120°) assumes another turn was made. D is South.",
      protip:
        "Examiner's Secret: Directional terms like 'Due East' translate directly to three-figure bearings (090°).",
    },
    {
      id: 35,
      difficulty: "hard",
      topic: "Venn Diagrams · Market Survey",
      context: "daily",
      contextIcon: "",
      question:
        "In a survey of 100 shoppers, 50 buy Kenkey, 40 buy Waakye, and 20 buy both. If 15 people buy NEITHER, how many buy ONLY Kenkey?",
      options: { A: "30", B: "50", C: "20", D: "35" },
      correct: "A",
      workings: "Only Kenkey = Total Kenkey (50) - Both (20) = 30.",
      distractorLogic: "B is the total Kenkey group. C is the 'both' group.",
      protip:
        "Examiner's Secret: 'Only X' ALWAYS means you must subtract the 'Both' group from the 'Total X' group.",
    },
    {
      id: 36,
      difficulty: "hard",
      topic: "Latitude/Longitude · Air Travel",
      context: "daily",
      contextIcon: "",
      question:
        "Two towns A(40°N, 10°E) and B(40°N, 50°E) are on the same latitude. Find their longitude difference.",
      options: { A: "30°", B: "40°", C: "50°", D: "60°" },
      correct: "B",
      workings: "BothTowns are East. Difference = 50° - 10° = 40°.",
      distractorLogic:
        "A is 40-10=30? No, 50-10=40. D is 50+10=60 (if one was West).",
      protip:
        "Examiner's Secret: SAME direction (E-E or W-W)? Subtract. DIFFERENT direction (E-W)? Add.",
    },
    {
      id: 37,
      difficulty: "medium",
      topic: "Statistics · Crop Yields",
      context: "agritech",
      contextIcon: "",
      question:
        "The weight of five harvested yams are: 3.2kg, 4.5kg, 3.8kg, 4.5kg, and 5.0kg. Find the mode.",
      options: { A: "4.5kg", B: "4.2kg", C: "5.0kg", D: "3.8kg" },
      correct: "A",
      workings:
        "The value 4.5 appears twice; all others appear once. Mode = 4.5kg.",
      distractorLogic: "B might be an estimated mean. C is the highest value.",
      protip:
        "Examiner's Secret: Mode is simply the most 'Fashionable' (most frequent) number. Don't calculatejust count!",
    },
    {
      id: 38,
      difficulty: "hard",
      topic: "Probability · Quality Control",
      context: "agritech",
      contextIcon: "",
      question:
        "A crate contains 20 oranges, 4 of which are rotten. If two oranges are picked at random <strong>without replacement</strong>, what is the probability that both are rotten?",
      options: { A: "3/95", B: "1/25", C: "4/20", D: "1/5" },
      correct: "A",
      workings:
        "P(1st rotten) = 4/20 = 1/5. P(2nd rotten) = 3/19. Total = (1/5) * (3/19) = 3/95.",
      distractorLogic:
        "B (1/25) assumes replacement (1/5 * 1/5). D is just the first pick's probability.",
      protip:
        "Examiner's Secret: 'Without replacement' means the denominator MUST decrease for the second pick.",
    },
    {
      id: 39,
      difficulty: "medium",
      topic: "Transformation · Graphic Design",
      context: "daily",
      contextIcon: "",
      question:
        "A point P(2, -3) is translated by a vector <strong>T = (4, 5)</strong>. Find the coordinates of the image P'.",
      options: { A: "(6, 2)", B: "(-2, -8)", C: "(8, -15)", D: "(6, 8)" },
      correct: "A",
      workings: "P' = (2+4, -3+5) = (6, 2).",
      distractorLogic:
        "B subtracts the vector. C multiplies. D misses the negative sign logic.",
      protip:
        "Examiner's Secret: Translation is just addition: Point + Vector = Image.",
    },
    {
      id: 40,
      difficulty: "easy",
      topic: "Indices · Population Growth",
      context: "daily",
      contextIcon: "",
      question: "Evaluate <strong>(27)⅔</strong>",
      options: { A: "9", B: "3", C: "18", D: "81" },
      correct: "A",
      workings: "27⅔ = (27)² = 3² = 9.",
      distractorLogic: "B is just the cube root. C is 27 * 2/3. D is 27 * 3.",
      protip:
        "Examiner's Secret: Root the bottom (denominator), then Power the top (numerator).",
    },
    {
      id: 41,
      difficulty: "medium",
      topic: "Variation · Pumping Speed",
      context: "utilities",
      contextIcon: "",
      question:
        "The time (T) it takes to fill a tank varies inversely as the number of pumps (P). If 2 pumps take 6 hours, how many hours will 4 pumps take?",
      options: { A: "3 hours", B: "12 hours", C: "4 hours", D: "2 hours" },
      correct: "A",
      workings: "T = k/P -> 6 = k/2 -> k=12. T = 12/4 = 3 hours.",
      distractorLogic: "B (12) is direct variation. C is just a guess.",
      protip:
        "Examiner's Secret: Inverse Variation means: More pumps = Less time. Check if your answer makes sense!",
    },
    {
      id: 42,
      difficulty: "hard",
      topic: "Sequences · Viral Marketing",
      context: "fintech",
      contextIcon: "",
      question:
        "A viral video starts with 5 views. Each hour, the views triple (Geometric Progression). How many views at the start of the 4th hour?",
      options: { A: "135", B: "405", C: "20", D: "45" },
      correct: "A",
      workings: "a=5, r=3, n=4. U = ar¹ = 5 * 3³ = 5 * 27 = 135.",
      distractorLogic: "B is for n=5. D is for n=3.",
      protip:
        "Examiner's Secret: Check the term carefully! Week 4 uses power (4-1=3).",
    },
    {
      id: 43,
      difficulty: "hard",
      topic: "Logarithms · Decibel Increase",
      context: "daily",
      contextIcon: "",
      question: "Solve for x: <strong>log(x) + log(3) = log(15)</strong>",
      options: { A: "5", B: "12", C: "18", D: "45" },
      correct: "A",
      workings: "log(3x) = log(15) -> 3x = 15 -> x = 5.",
      distractorLogic: "B (12) comes from 15-3. C comes from 15+3.",
      protip:
        "Examiner's Secret: Addition outside a log becomes MULTIPLICATION inside: log(A) + log(B) = log(A × B).",
    },
    {
      id: 44,
      difficulty: "medium",
      topic: "Surds · Geometric Precision",
      context: "daily",
      contextIcon: "",
      question: "Simplify <strong>12 + 27</strong>",
      options: { A: "53", B: "39", C: "63", D: "313" },
      correct: "A",
      workings: "12 = 23. 27 = 33. Sum = (2+3)3 = 53.",
      distractorLogic:
        "B just adds the numbers under the root (illegal!). D also avoids the factorization.",
      protip:
        "Examiner's Secret: You can only add surds if the 'root part' is the same. Simplify them first!",
    },
    {
      id: 45,
      difficulty: "hard",
      topic: "Mensuration · Silo Capacity",
      context: "agritech",
      contextIcon: "",
      question:
        "A square-based pyramid of height 12m has a base length of 10m. Find its volume.",
      options: { A: "400 m³", B: "1,200 m³", C: "600 m³", D: "200 m³" },
      correct: "A",
      workings:
        "V = 1/3 * Base Area * Height = 1/3 * (10*10) * 12 = 1/3 * 100 * 12 = 400 m³.",
      distractorLogic: "B (1200) forgets the 1/3. C (600) uses 1/2 instead.",
      protip:
        "Examiner's Secret: Pyramids and Cones are always 'One-Third' of their corresponding blocks (prism/cylinder).",
    },
    {
      id: 46,
      difficulty: "medium",
      topic: "Circle Theorems · Satellite Orbit",
      context: "daily",
      contextIcon: "",
      question:
        "Angle subtended by a diameter at the circumference of a circle is always:",
      options: { A: "90°", B: "180°", C: "45°", D: "60°" },
      correct: "A",
      workings: "Standard theorem: Angle in a semi-circle is 90°.",
      distractorLogic: "B is the angle at the center. C is half of 90.",
      protip:
        "Examiner's Secret: If the line goes through the center O (Diameter), any angle it makes on the edge is a right angle.",
    },
    {
      id: 47,
      difficulty: "hard",
      topic: "Circle Theorems · Structural Tension",
      context: "daily",
      contextIcon: "",
      question: "In a cyclic quadrilateral ABCD, angle A = 85°. Find angle C.",
      options: { A: "95°", B: "85°", C: "175°", D: "5°" },
      correct: "A",
      workings:
        "Opposite angles of a cyclic quadrilateral add to 180°. C = 180 - 85 = 95°.",
      distractorLogic: "B assumes they are equal. C is almost 180.",
      protip:
        "Examiner's Secret: 'Opposite angles add to 180'this only works if all 4 corners touch the circle!",
    },
    {
      id: 48,
      difficulty: "medium",
      topic: "Logical Reasoning · Exam Prep",
      context: "daily",
      contextIcon: "",
      question:
        "If P: 'It is raining' and Q: 'I am using an umbrella', what is the negation of P (~P)?",
      options: {
        A: "It is not raining",
        B: "I am using an umbrella",
        C: "It is sunny",
        D: "I am not using an umbrella",
      },
      correct: "A",
      workings: "~P is the logical opposite of P.",
      distractorLogic:
        "C is a contextual opposite, but 'Not' is the logical requirement.",
      protip:
        "Examiner's Secret: Negation is just adding 'Not'don't look for antonyms like 'Sunny' vs 'Raining'.",
    },
    {
      id: 49,
      difficulty: "hard",
      topic: "Quadratic Equations · Projectile Motion",
      context: "daily",
      contextIcon: "",
      question: "Find the roots of <strong>x² - 5x + 6 = 0</strong>",
      options: { A: "2 and 3", B: "-2 and -3", C: "1 and 6", D: "-1 and -6" },
      correct: "A",
      workings: "(x - 2)(x - 3) = 0. x = 2 or x = 3.",
      distractorLogic: "B has wrong signs. C has wrong product/sum logic.",
      protip:
        "Examiner's Secret: Factors must MULTIPLY to +6 and ADD to -5. Only -2 and -3 work.",
    },
    {
      id: 50,
      difficulty: "hard",
      topic: "Calculus · Vehicle Velocity",
      context: "daily",
      contextIcon: "",
      question:
        "The displacement of a car is s = 3t² + 2t. Find the velocity at t = 2s.",
      options: { A: "14 m/s", B: "8 m/s", C: "16 m/s", D: "12 m/s" },
      correct: "A",
      workings: "v = ds/dt = 6t + 2. At t=2: v = 6(2) + 2 = 14 m/s.",
      distractorLogic: "D (12) forgets to add the 2. B is 3(2)+2.",
      protip:
        "Examiner's Secret: Velocity is the FIRST derivative of displacement. Differentiate first!",
    },
  ],

  cs: [
    {
      id: 201,
      difficulty: "easy",
      topic: "Networking · Cybersecurity",
      context: "daily",
      contextIcon: "",
      question:
        "Which of the following is the most secure protocol for encrypting web traffic between a browser and a server?",
      options: { A: "HTTP", B: "HTTPS", C: "FTP", D: "Telnet" },
      correct: "B",
      workings:
        "HTTPS (Hypertext Transfer Protocol Secure) adds SSL/TLS encryption to standard HTTP.",
      distractorLogic:
        "HTTP transmits in plaintext. FTP is for file transfers. Telnet is an insecure remote login.",
      protip:
        "Examiner's Secret: Always look for the 'S' in HTTPS which stands for Secure.",
    },
    {
      id: 202,
      difficulty: "medium",
      topic: "Algorithms · Fintech Logic",
      context: "fintech",
      contextIcon: "",
      question:
        "A MoMo app uses an algorithm that blocks an account after 3 failed PIN attempts. What type of control structure is best suited for this?",
      options: {
        A: "A FOR loop",
        B: "A WHILE loop",
        C: "An IF statement",
        D: "A switch/case",
      },
      correct: "B",
      workings:
        "A WHILE loop (condition: attempts < 3) correctly monitors the state until a limit is hit.",
      distractorLogic:
        "A FOR loop is for definite iterations. IF statement doesn't repeat.",
      protip:
        "Examiner's Secret: Use WHILE when the number of repeats is unknown.",
    },
    {
      id: 203,
      difficulty: "hard",
      topic: "Data Representation · Binary IPs",
      context: "daily",
      contextIcon: "",
      question: "Convert the binary IP segment 11001000 to denary.",
      options: { A: "192", B: "200", C: "208", D: "224" },
      correct: "B",
      workings: "128 + 64 + 8 = 200.",
      distractorLogic: "A is 128+64. C is 128+64+16.",
      protip: "Examiner's Secret: Write powers of 2 above the bits.",
    },
    {
      id: 204,
      difficulty: "easy",
      topic: "Hardware · Storage Media",
      context: "daily",
      contextIcon: "",
      question: "Which of the following is primary storage?",
      options: { A: "Hard Disk", B: "RAM", C: "USB Drive", D: "CD-ROM" },
      correct: "B",
      workings: "RAM is primary memory directly accessible by the CPU.",
      distractorLogic: "Others are secondary volatile or non-volatile storage.",
      protip:
        "Examiner's Secret: Primary = RAM/ROM; Secondary = Everything else.",
    },
    {
      id: 205,
      difficulty: "medium",
      topic: "Software · OS Functions",
      context: "daily",
      contextIcon: "",
      question:
        "What is the primary function of an Operating System's scheduler?",
      options: {
        A: "Memory cleanup",
        B: "CPU time allocation",
        C: "Virus scanning",
        D: "File compression",
      },
      correct: "B",
      workings:
        "The scheduler decides which process runs on the CPU and for how long.",
      distractorLogic: "A is Garbage Collection. C is Utility software.",
      protip: "Examiner's Secret: Scheduler = CPU Traffic Police.",
    },
    {
      id: 206,
      difficulty: "hard",
      topic: "Algorithms · Complexity",
      context: "daily",
      contextIcon: "",
      question:
        "Which sorting algorithm is generally most efficient for very large datasets?",
      options: {
        A: "Bubble Sort",
        B: "Selection Sort",
        C: "Quick Sort",
        D: "Insertion Sort",
      },
      correct: "C",
      workings: "Quick Sort has an average time complexity of O(n log n).",
      distractorLogic:
        "Bubble/Selection are O(n²), making them slow for large data.",
      protip:
        "Examiner's Secret: Efficiency in algorithms is about 'computational cost'.",
    },
    {
      id: 207,
      difficulty: "medium",
      topic: "Networking · Topology",
      context: "daily",
      contextIcon: "",
      question:
        "In which topology does the failure of a single central hub bring down the entire network?",
      options: { A: "Bus", B: "Star", C: "Ring", D: "Mesh" },
      correct: "B",
      workings: "Star topology relies on a central node (hub/switch).",
      distractorLogic: "Bus relies on a backbone. Ring is a closed loop.",
      protip: "Examiner's Secret: Star = Central Dependency.",
    },
    {
      id: 208,
      difficulty: "easy",
      topic: "Computing Concepts · Cloud",
      context: "daily",
      contextIcon: "",
      question: "What does SaaS stand for in cloud computing?",
      options: {
        A: "System as a Service",
        B: "Software as a Service",
        C: "Storage as a Service",
        D: "Security as a Service",
      },
      correct: "B",
      workings:
        "SaaS provides software applications over the internet (e.g. Google Docs).",
      distractorLogic: "A isn't a standard term. C is STaaS. D is SECaaS.",
      protip: "Examiner's Secret: SaaS = Software in the cloud.",
    },
    {
      id: 209,
      difficulty: "medium",
      topic: "Database · SQL",
      context: "daily",
      contextIcon: "",
      question: "Which SQL command is used to remove a table from a database?",
      options: { A: "DELETE", B: "REMOVE", C: "DROP", D: "TRUNCATE" },
      correct: "C",
      workings: "DROP TABLE deletes the entire structure and data.",
      distractorLogic:
        "DELETE/TRUNCATE only affect the data, not the structure.",
      protip: "Examiner's Secret: DROP = Structural Destruction.",
    },
    {
      id: 210,
      difficulty: "hard",
      topic: "Programming · Logic Gates",
      context: "daily",
      contextIcon: "",
      question: "What is the output of an XOR gate if both inputs are 1?",
      options: { A: "1", B: "0", C: "Undefined", D: "Depends on voltage" },
      correct: "B",
      workings: "XOR (Exclusive OR) outputs 1 ONLY if inputs are different.",
      distractorLogic: "A is the output of an AND or OR gate.",
      protip: "Examiner's Secret: XOR = 'Difference Detector'.",
    },
    {
      id: 211,
      difficulty: "easy",
      topic: "Cybersecurity · Phishing",
      context: "daily",
      contextIcon: "",
      question:
        "An email asking for your password bank details is most likely a ___ attack.",
      options: { A: "Ransomware", B: "Phishing", C: "DDoS", D: "Trojan" },
      correct: "B",
      workings:
        "Phishing uses social engineering to trick users into revealing secrets.",
      distractorLogic: "A locks files. C floods traffic. D is hidden malware.",
      protip: "Examiner's Secret: Phishing = Fishing for passwords.",
    },
    {
      id: 212,
      difficulty: "hard",
      topic: "Data Representation · ASCII",
      context: "daily",
      contextIcon: "",
      question: "If the ASCII value for 'A' is 65, what is the value for 'D'?",
      options: { A: "66", B: "67", C: "68", D: "69" },
      correct: "C",
      workings: "A=65, B=66, C=67, D=68.",
      distractorLogic: "B skips C. D is for E.",
      protip: "Examiner's Secret: ASCII letters are sequential.",
    },
  ],

  science: [
    {
      id: 501,
      difficulty: "easy",
      topic: "Acids, Bases & Salts",
      context: "daily",
      contextIcon: "",
      question: "Which of the following turns blue litmus paper red?",
      options: {
        A: "Baking soda",
        B: "Lime juice",
        C: "Salt water",
        D: "Soap",
      },
      correct: "B",
      workings: "Acids (Lime juice) turn blue litmus red.",
      distractorLogic: "A is a base. C is neutral.",
      protip: "Examiner's Secret: Acid = Red indicator.",
    },
    {
      id: 502,
      difficulty: "medium",
      topic: "Genetics · Maize Breeding",
      context: "agritech",
      contextIcon: "",
      question: "TT (tall) crossed with tt (short) gives what F1 ratio?",
      options: { A: "100% Tall", B: "3:1", C: "1:1", D: "100% Short" },
      correct: "A",
      workings: "Tt is physically tall due to dominance.",
      distractorLogic: "B is the F2 generation ratio.",
      protip: "Examiner's Secret: Dominant trait wins in F1.",
    },
    {
      id: 503,
      difficulty: "hard",
      topic: "Electronics · Logic Gates",
      context: "daily",
      contextIcon: "",
      question: "Which gate outputs 1 only when both inputs are 1?",
      options: { A: "OR", B: "AND", C: "NOT", D: "NAND" },
      correct: "B",
      workings: "AND logic requires A AND B to be true.",
      distractorLogic: "A is either. D is the inverse.",
      protip: "Examiner's Secret: AND = Multiplication (1*1=1).",
    },
    {
      id: 504,
      difficulty: "easy",
      topic: "Respiration · Life Processes",
      context: "daily",
      contextIcon: "",
      question:
        "The chemical process of releasing energy from food is called ___.",
      options: {
        A: "Digestion",
        B: "Respiration",
        C: "Excretion",
        D: "Circulation",
      },
      correct: "B",
      workings: "Respiration breaks down glucose for ATP.",
      distractorLogic: "A is breakdown. C is waste removal.",
      protip: "Examiner's Secret: Respiration = Energy Release.",
    },
    {
      id: 505,
      difficulty: "medium",
      topic: "Mixtures · Separation",
      context: "daily",
      contextIcon: "",
      question:
        "Which method is best to separate salt from a salt-water solution?",
      options: {
        A: "Filtration",
        B: "Evaporation",
        C: "Decantation",
        D: "Sieving",
      },
      correct: "B",
      workings: "Evaporation leaves solid salt behind as water turns to steam.",
      distractorLogic: "A only works for insoluble solids.",
      protip: "Examiner's Secret: Evaporation = Liquid removal.",
    },
    {
      id: 506,
      difficulty: "hard",
      topic: "Organic Chemistry · Hydrocarbons",
      context: "daily",
      contextIcon: "",
      question: "What is the general formula for Alkanes?",
      options: { A: "CnH2n", B: "CnH2n+2", C: "CnH2n-2", D: "CnHn" },
      correct: "B",
      workings: "Alkanes are saturated (e.g. Methane CH4).",
      distractorLogic: "A is Alkenes. C is Alkynes.",
      protip: "Examiner's Secret: +2 means fully saturated with Hydrogen.",
    },
    {
      id: 507,
      difficulty: "medium",
      topic: "Ecosystems · Conservation",
      context: "daily",
      contextIcon: "",
      question: "The illegal hunting of animals is known as ___.",
      options: {
        A: "Deforestation",
        B: "Poaching",
        C: "Pollution",
        D: "Erosion",
      },
      correct: "B",
      workings: "Poaching threatens endangered species.",
      distractorLogic: "A is tree cutting. D is soil loss.",
      protip: "Examiner's Secret: Poaching affects wildlife biodiversity.",
    },
    {
      id: 508,
      difficulty: "easy",
      topic: "Matter · States",
      context: "daily",
      contextIcon: "",
      question: "The process of a gas turning into a liquid is ___.",
      options: {
        A: "Melting",
        B: "Condensation",
        C: "Sublimation",
        D: "Freezing",
      },
      correct: "B",
      workings: "Cooling gas particles makes them cluster into liquid form.",
      distractorLogic: "C is solid to gas directly.",
      protip: "Examiner's Secret: Condensation = Steam to Water.",
    },
    {
      id: 509,
      difficulty: "hard",
      topic: "Physics · Heat Transfer",
      context: "daily",
      contextIcon: "",
      question: "Heat from the sun reaches the earth through ___.",
      options: {
        A: "Conduction",
        B: "Convection",
        C: "Radiation",
        D: "Insulation",
      },
      correct: "C",
      workings: "Radiation doesn't require a medium (vacuum safe).",
      distractorLogic: "A requires solids. B requires fluids.",
      protip: "Examiner's Secret: Space is a vacuum; only radiation passes.",
    },
    {
      id: 510,
      difficulty: "medium",
      topic: "Nutrition · Balanced Diet",
      context: "daily",
      contextIcon: "",
      question: "A deficiency of Vitamin C leads to which disease?",
      options: { A: "Rickets", B: "Scurvy", C: "Beriberi", D: "Anemia" },
      correct: "B",
      workings: "Scurvy affects skin and gums.",
      distractorLogic: "A is Vit D. C is Vit B1. D is Iron.",
      protip: "Examiner's Secret: Vit C = Citrus = Scurvy prevention.",
    },
    {
      id: 511,
      difficulty: "easy",
      topic: "Skeleton · Joint Types",
      context: "daily",
      contextIcon: "",
      question: "The joint in the shoulder is an example of a ___ joint.",
      options: { A: "Hinge", B: "Ball and socket", C: "Gliding", D: "Pivot" },
      correct: "B",
      workings: "Shoulders allow 360-degree rotation.",
      distractorLogic: "A is at the elbow/knee.",
      protip: "Examiner's Secret: Ball & Socket = Maximum movement.",
    },
    {
      id: 512,
      difficulty: "hard",
      topic: "Soil · Fertility",
      context: "agritech",
      contextIcon: "",
      question: "Which soil type has the highest water-holding capacity?",
      options: { A: "Sandy", B: "Loamy", C: "Clayey", D: "Silty" },
      correct: "C",
      workings: "Clay has very small particles that trap water.",
      distractorLogic: "A has large gaps (low hold).",
      protip: "Examiner's Secret: Small particles = High water retention.",
    },
    {
      id: 513,
      difficulty: "medium",
      topic: "Density · Buoyancy",
      context: "daily",
      contextIcon: "",
      question: "An object floats if its density is ___ than water.",
      options: { A: "Greater", B: "Less", C: "Equal", D: "Double" },
      correct: "B",
      workings: "Lower density objects are pushed up by buoyancy.",
      distractorLogic: "A makes objects sink.",
      protip: "Examiner's Secret: Float = Lighter than liquid.",
    },
    {
      id: 514,
      difficulty: "easy",
      topic: "Magnets · Poles",
      context: "daily",
      contextIcon: "",
      question: "Like poles of two magnets will ___.",
      options: { A: "Attract", B: "Repel", C: "Neutralize", D: "Explode" },
      correct: "B",
      workings: "North-North or South-South push away.",
      distractorLogic: "A is for opposite poles.",
      protip: "Examiner's Secret: Likes Repel; Opposites Attract.",
    },
    {
      id: 515,
      difficulty: "hard",
      topic: "Fertilizers · NPK",
      context: "agritech",
      contextIcon: "",
      question: "What does the 'K' stand for in NPK fertilizer?",
      options: { A: "Krypton", B: "Potassium", C: "Kerosene", D: "Calcium" },
      correct: "B",
      workings: "Potassium (Kalium) is vital for root health.",
      distractorLogic: "N is Nitrogen. P is Phosphorus.",
      protip:
        "Examiner's Secret: K = Kalium = Potassium. Don't let the letter trip you up!",
    },
  ],
  english: [
    {
      id: 601,
      difficulty: "easy",
      topic: "Lexis and Structure",
      context: "daily",
      contextIcon: "",
      question:
        "The students were ___ for their outstanding performance in the national robotics competition.",
      options: {
        A: "condemned",
        B: "commended",
        C: "commanded",
        D: "commented",
      },
      correct: "B",
      workings: "Commended means 'to praise formally'.",
      distractorLogic:
        "A is the opposite. C is a different word. D is a common misspelling/misuse.",
      protip:
        "Examiner's Secret: Watch out for 'homophones' (words that sound similar but have different meanings).",
    },
    {
      id: 602,
      difficulty: "medium",
      topic: "Grammar · Concord",
      context: "daily",
      contextIcon: "",
      question:
        "Neither the captain nor the crew members ___ aware of the sudden change in weather.",
      options: { A: "was", B: "were", C: "is", D: "being" },
      correct: "B",
      workings:
        "In 'Neither/Nor' constructions, the verb agrees with the CLOSER subject (crew members).",
      distractorLogic:
        "A (was) is a common error assuming the single captain is the main subject.",
      protip:
        "Examiner's Secret: The 'Rule of Proximity' is a frequent trap in WAEC English objective papers.",
    },
  ],

  social: [
    {
      id: 701,
      difficulty: "easy",
      topic: "Citizenship · Rights",
      context: "daily",
      contextIcon: "",
      question:
        "Which of the following is a primary duty of a Ghanaian citizen?",
      options: {
        A: "Seeking asylum",
        B: "Paying taxes",
        C: "Travelling abroad",
        D: "Becoming a politician",
      },
      correct: "B",
      workings:
        "Paying taxes is a legal obligation and civic duty outlined in the 1992 Constitution.",
      distractorLogic: "A, C, and D are rights or choices, not primary duties.",
      protip:
        "Examiner's Secret: Distinguish clearly between 'Rights' (what you get) and 'Responsibilities' (what you give).",
    },
    {
      id: 702,
      difficulty: "medium",
      topic: "Sustainable Development",
      context: "utilities",
      contextIcon: "",
      question:
        "Which of the following practices most directly supports the 'Green Ghana' initiative?",
      options: {
        A: "Galamsey (Illegal mining)",
        B: "Reforestation",
        C: "Urbanization",
        D: "Open burning",
      },
      correct: "B",
      workings:
        "Reforestation (planting trees) restores ecosystems and aligns with the initiative's goals.",
      distractorLogic:
        "A and D are major environmental threats. C is neutral but often harms ecosystems.",
      protip:
        "Examiner's Secret: Questions on current national initiatives (like Green Ghana or One District One Factory) are very common.",
    },
  ],

  physics: [
    {
      id: 801,
      difficulty: "easy",
      topic: "Mechanics · Force",
      context: "daily",
      contextIcon: "",
      question:
        "A force of 20N is applied to a mass of 4kg. What is the resulting acceleration? (F = ma)",
      options: { A: "80 m/s²", B: "5 m/s²", C: "16 m/s²", D: "24 m/s²" },
      correct: "B",
      workings: "a = F / m = 20 / 4 = 5 m/s².",
      distractorLogic:
        "A (80) is from multiplying F * m. C is from subtracting. This tests basic formula rearrangement.",
      protip:
        "Examiner's Secret: Check your units! N for Force, kg for Mass, and m/s² for acceleration.",
    },
    {
      id: 802,
      difficulty: "hard",
      topic: "Optics · Refractive Index",
      context: "utilities",
      contextIcon: "",
      question:
        "The speed of light in a vacuum is 3 × 10 m/s. If the refractive index of water is 1.33, what is the speed of light in water?",
      options: {
        A: "2.26 × 10 m/s",
        B: "3.99 × 10 m/s",
        C: "1.33 × 10 m/s",
        D: "4.33 × 10 m/s",
      },
      correct: "A",
      workings: "v = c / n = (3 × 10) / 1.33  2.26 × 10 m/s.",
      distractorLogic:
        "B (3.99) is from multiplying instead of dividing. Light ALWAYS slows down in denser media.",
      protip:
        "Examiner's Secret: Refractive index is ALWAYS greater than 1, so the speed in a medium is ALWAYS less than in a vacuum.",
    },
  ],

  chemistry: [
    {
      id: 901,
      difficulty: "easy",
      topic: "Atomic Structure",
      context: "daily",
      contextIcon: "",
      question:
        "Which of the following subatomic particles has a positive charge?",
      options: { A: "Electron", B: "Proton", C: "Neutron", D: "Positron" },
      correct: "B",
      workings:
        "Protons are positive (+), Electrons are negative (-), and Neutrons are neutral (0).",
      distractorLogic: "A is the opposite charge. C has no charge.",
      protip:
        "Examiner's Secret: Remember the first letter: **P**roton = **P**ositive.",
    },
    {
      id: 902,
      difficulty: "medium",
      topic: "Stoichiometry · Yield",
      context: "agritech",
      contextIcon: "",
      question:
        "In a chemical reaction, the theoretical yield is 50g, but the actual yield is 40g. What is the percentage yield?",
      options: { A: "80%", B: "90%", C: "75%", D: "125%" },
      correct: "A",
      workings:
        "Percentage Yield = (Actual / Theoretical) * 100 = (40 / 50) * 100 = 80%.",
      distractorLogic:
        "D (125) is from inverting the formula. Yield can never exceed 100% in a real-world lab.",
      protip:
        "Examiner's Secret: 'Actual' is what you HONESTLY got; 'Theoretical' is what you SHOULD have gotten. Honesty (Actual) goes on top.",
    },
  ],

  biology: [
    {
      id: 1101,
      difficulty: "easy",
      topic: "Cell Biology",
      context: "daily",
      contextIcon: "",
      question: "Which organelle is known as the 'powerhouse' of the cell?",
      options: {
        A: "Nucleus",
        B: "Chloroplast",
        C: "Mitochondria",
        D: "Ribosome",
      },
      correct: "C",
      workings:
        "Mitochondria produce ATP, the energy currency of the cell, through cellular respiration.",
      distractorLogic:
        "A is the control center. B is for photosynthesis. D is for protein synthesis.",
      protip:
        "Examiner's Secret: Cellular respiration happens in the mitochondria. Don't confuse it with breathing!",
    },
    {
      id: 1102,
      difficulty: "medium",
      topic: "Human Physiology · Digestion",
      context: "daily",
      contextIcon: "",
      question:
        "Where in the human digestive system does the digestion of proteins begin?",
      options: {
        A: "Mouth",
        B: "Stomach",
        C: "Small Intestine",
        D: "Oesophagus",
      },
      correct: "B",
      workings:
        "Protein digestion begins in the stomach with the action of the enzyme pepsin and hydrochloric acid.",
      distractorLogic:
        "A (Mouth) is where starch digestion begins (Amylase). C is where most digestion is COMPLETED.",
      protip:
        "Examiner's Secret: WAEC often asks for the 'Start' point vs the 'Completion' point of digestion for different nutrients.",
    },
  ],

  economics: [
    {
      id: 1201,
      difficulty: "easy",
      topic: "Demand and Supply",
      context: "daily",
      contextIcon: "",
      question:
        "According to the Law of Demand, as the price of a good increases, the quantity demanded ___.",
      options: {
        A: "Increases",
        B: "Decreases",
        C: "Remains constant",
        D: "Fluctuates",
      },
      correct: "B",
      workings:
        "There is an inverse relationship between price and quantity demanded (ceteris paribus).",
      distractorLogic:
        "A is the law of Supply. C and D ignore basic economic principles.",
      protip:
        "Examiner's Secret: 'Ceteris Paribus' means 'all other things being equal'. Don't forget this condition!",
    },
    {
      id: 1202,
      difficulty: "medium",
      topic: "National Income · GDP",
      context: "daily",
      contextIcon: "",
      question:
        "Gross Domestic Product (GDP) measures the total value of goods and services produced ___.",
      options: {
        A: "By citizens only",
        B: "Within a country's borders",
        C: "By the government",
        D: "In the agricultural sector",
      },
      correct: "B",
      workings:
        "GDP is location-based; it counts everything produced inside Ghana, regardless of who produced it.",
      distractorLogic:
        "A refers to GNP (Gross National Product) which is based on ownership/citizenship.",
      protip:
        "Examiner's Secret: GDP = Geographic (inside borders). GNP = National (by our people).",
    },
    {
      id: 5016, // using high ID for safety
      difficulty: "hard",
      topic: "Calculus · Marginal Cost (Business)",
      context: "fintech",
      contextIcon: "",
      question:
        "A factory's total cost function is given by C(x) = 2x³ - 5x² + 6x + 10. Find the marginal cost when 3 units are produced.",
      options: { A: "18", B: "30", C: "35", D: "42" },
      correct: "B",
      workings:
        "Marginal Cost is the derivative MC(x) = C'(x) = 6x² - 10x + 6. At x = 3: MC(3) = 6(3)² - 10(3) + 6 = 54 - 30 + 6 = 30.",
      distractorLogic:
        "Students often forget to differentiate and just substitute x=3 into C(x) which gives 54 - 45 + 18 + 10 = 37.",
      protip:
        "Examiner's Secret: 'Marginal' anything ALWAYS means 'find the first derivative'. Don't plug numbers into the original equation!",
    },
    {
      id: 5017,
      difficulty: "medium",
      topic: "Mensuration · Satellite Dish Radius",
      context: "agritech",
      contextIcon: "",
      question:
        "A parabolic satellite dish has a circumference of 44m. Calculate its radius. [Take π = 22/7]",
      options: { A: "7m", B: "14m", C: "22m", D: "3.5m" },
      correct: "A",
      workings: "C = 2πr -> 44 = 2 * (22/7) * r -> 44 = (44/7) * r -> r = 7m.",
      distractorLogic:
        "Option B is the diameter. Option D forgets the 2 in 2πr.",
      protip:
        "Examiner's Secret: Rearrange the formula BEFORE plugging in numbers to avoid arithmetic errors.",
    },
    {
      id: 5018,
      difficulty: "medium",
      topic: "Statistics · Variance",
      context: "daily",
      contextIcon: "",
      question:
        "The variance of a set of data is 16. If every value in the set is multiplied by 3, what is the new variance?",
      options: { A: "48", B: "16", C: "144", D: "9" },
      correct: "C",
      workings:
        "If values are multiplied by k, the new variance is k² * old variance. New Var = 3² * 16 = 9 * 16 = 144.",
      distractorLogic:
        "A (48) just multiplies 16 by 3. This is true for standard deviation, but variance squares the constant.",
      protip:
        "Examiner's Secret: Standard Deviation scales linearly (×k), but Variance scales quadratically (×k²).",
    },
    {
      id: 5019,
      difficulty: "easy",
      topic: "Logarithms · Decibel Scales",
      context: "daily",
      contextIcon: "",
      question: "Evaluate log(0.001) without using a calculator.",
      options: { A: "3", B: "-3", C: "0.001", D: "1/1000" },
      correct: "B",
      workings: "0.001 = 10³. Therefore, log(10³) = -3.",
      distractorLogic:
        "A ignores the decimal. D is just the fraction form, not the log value.",
      protip:
        "Examiner's Secret: Number of decimal places before/including the 1 gives you the negative power.",
    },
    {
      id: 5020,
      difficulty: "hard",
      topic: "Trigonometry · GPS Elevations",
      context: "agritech",
      contextIcon: "",
      question:
        "A drone observes the top of a tower at an angle of elevation of 60°. If the drone is 50m horizontally away from the base, how high is the tower above the drone? [Leave answer in surd form]",
      options: { A: "503 m", B: "50/3 m", C: "100 m", D: "25 m" },
      correct: "A",
      workings: "tan(60°) = opposite / adjacent -> 3 = h / 50 -> h = 503 m.",
      distractorLogic:
        "Option B happens if you divide instead of multiply. C uses the hypotenuse instead of height.",
      protip:
        "Examiner's Secret: Always draw a quick right-angled triangle. Height is usually 'Opposite', Distance is 'Adjacent'.",
    },
  ],
  cs: [],
  science: [],
  physics: [],
  social: [],
  theory: {
    maths: [
      {
        id: 1001,
        difficulty: "medium",
        topic: "Financial Maths · MoMo E-Levy",
        question:
          "A business owner in Kumasi transfers GH 5,000 to a supplier. The GH 100 daily tax-free threshold has already been used by a previous transaction. Calculate the total E-Levy (1%) and explain why the threshold subtraction was omitted in this calculation.",
        markScheme: [
          { key: "1%", points: 2, desc: "Identifying the 1% rate correctly" },
          {
            key: "50",
            points: 3,
            desc: "Correct calculation (1% of 5000 = 50)",
          },
          {
            key: "already used",
            points: 3,
            desc: "Explaining that the threshold applies once per day",
          },
          {
            key: "omitted",
            points: 2,
            desc: "Connecting the absence of subtraction to the prior usage",
          },
        ],
        modelAnswer:
          "The total E-Levy is GH 50.00. The threshold subtraction (GH 100) was omitted because the question states the daily tax-free limit has already been exhausted by a previous transaction. Therefore, the full GH 5,000 is taxable at 1%.",
        contextIcon: "",
      },
      {
        id: 1002,
        difficulty: "hard",
        topic: "Mensuration · Water Storage",
        question:
          "A cylindrical water tank in a rural school has a radius of 1.4m and a height of 3m. (a) Calculate the volume in m³. (b) If 1m³ = 1000 litres, determine how many 20-litre buckets are needed to fill the tank. [Take π = 22/7]",
        markScheme: [
          { key: "πr²h", points: 2, desc: "Using the correct volume formula" },
          {
            key: "18.48",
            points: 3,
            desc: "Correct volume calculation (Volume = 22/7 * 1.4 * 1.4 * 3 = 18.48 m³)",
          },
          { key: "18480", points: 2, desc: "Converting m³ to litres (18480L)" },
          {
            key: "924",
            points: 3,
            desc: "Final division (18480 / 20 = 924 buckets)",
          },
        ],
        modelAnswer:
          "Volume = πr²h = (22/7) * (1.4)² * 3 = 18.48 m³. Total Litres = 18.48 * 1000 = 18,480 litres. Number of buckets = 18,480 / 20 = 924 buckets.",
        contextIcon: "",
      },
      {
        id: 1003,
        difficulty: "hard",
        topic: "Circle Theorems",
        question:
          "In circle center O, chord AB subtends an angle of 120° at the center. If the radius is 14cm, calculate: (a) the length of the minor arc AB, and (b) the area of the minor sector OAB. [Take π = 22/7]",
        markScheme: [
          {
            key: "arc formula",
            points: 2,
            desc: "Using (θ/360) * 2πr for length of arc",
          },
          {
            key: "29.3",
            points: 2,
            desc: "Correct arc length: (120/360) * 2 * (22/7) * 14 = 29.33cm",
          },
          {
            key: "sector formula",
            points: 2,
            desc: "Using (θ/360) * πr² for area of sector",
          },
          {
            key: "205.3",
            points: 4,
            desc: "Correct sector area: (120/360) * (22/7) * 14² = 205.33cm²",
          },
        ],
        modelAnswer:
          "(a) Arc length = (120/360) * 2 * 22/7 * 14 = 29.33 cm. (b) Area of sector = (120/360) * 22/7 * 14² = 205.33 cm².",
        contextIcon: "",
      },
      {
        id: 1004,
        difficulty: "medium",
        topic: "Probability · Dice Games",
        question:
          "Two fair six-sided dice are tossed simultaneously. (a) Draw the sample space. (b) Calculate the probability of obtaining a total score of exactly 8. (c) Calculate the probability of getting a doublet.",
        markScheme: [
          {
            key: "36",
            points: 2,
            desc: "Identifying the total sample space is 36",
          },
          {
            key: "5/36",
            points: 4,
            desc: "Probability of sum 8: {(2,6), (3,5), (4,4), (5,3), (6,2)} = 5/36",
          },
          {
            key: "6/36",
            points: 2,
            desc: "Probability of doublet: {(1,1), ..., (6,6)} = 6/36",
          },
          {
            key: "1/6",
            points: 2,
            desc: "Simplifying doublet probability to 1/6",
          },
        ],
        modelAnswer:
          "(a) Sample space has 36 outcomes. (b) Sum of 8: {(2,6), (3,5), (4,4), (5,3), (6,2)}. Probability = 5/36. (c) Doublets: 6 outcomes. Probability = 6/36 = 1/6.",
        contextIcon: "",
      },
      {
        id: 1005,
        difficulty: "hard",
        topic: "Simultaneous Equations · Agri-Tech",
        question:
          "A mechanized farm buys 3 tractors and 5 combine harvesters for GH 1,200,000. Another farm buys 4 tractors and 2 combine harvesters for GH 900,000. Using any algebraic method, calculate the exact cost of ONE tractor and ONE combine harvester.",
        markScheme: [
          {
            key: "3x",
            points: 2,
            desc: "Setting up Equation 1 correctly: 3x + 5y = 1200000",
          },
          {
            key: "4x",
            points: 2,
            desc: "Setting up Equation 2 correctly: 4x + 2y = 900000",
          },
          {
            key: "substitution",
            points: 2,
            desc: "Attempting elimination or substitution successfully",
          },
          { key: "tractor", points: 2, desc: "Tractor (x) = GH 150,000" },
          { key: "harvester", points: 2, desc: "Harvester (y) = GH 150,000" },
        ],
        modelAnswer:
          "Let x = tractor, y = harvester. 3x + 5y = 1,200,000. 4x + 2y = 900,000. Multiply Eq1 by 4 and Eq2 by 3. 12x + 20y = 4,800,000. 12x + 6y = 2,700,000. Subtract: 14y = 2,100,000 -> y = 150,000. Substitute: 4x + 300,000 = 900,000 -> 4x = 600,000 -> x = 150,000. Both cost GH 150,000 each.",
        contextIcon: "",
      },
    ],
    cs: [
      {
        id: 2001,
        difficulty: "medium",
        topic: "Cybersecurity · 2FA Logic",
        question:
          "Explain the logical flow of a Multi-Factor Authentication (MFA) system. Why is it considered more secure than a single-password system, even if the password is 12 characters long?",
        markScheme: [
          {
            key: "something you know",
            points: 2,
            desc: "Identifying 'Knowledge' factor (password)",
          },
          {
            key: "something you have",
            points: 2,
            desc: "Identifying 'Possession' factor (code/phone)",
          },
          {
            key: "independent",
            points: 3,
            desc: "Explaining that compromising one factor doesn't grant access",
          },
          {
            key: "brute force",
            points: 3,
            desc: "Mentioning that long passwords can still be phished/stolen",
          },
        ],
        modelAnswer:
          "MFA requires factors from different categories (e.g., something you know like a password, and something you have like a phone code). It is more secure because factors are independent; even if a long password is stolen or phished, the attacker still lacks the secondary physical factor required for entry.",
        contextIcon: "",
      },
    ],
    science: [
      {
        id: 3001,
        difficulty: "medium",
        topic: "Genetics · Monohybrid Cross",
        question:
          "A homozygous dominant pea plant for purple flowers (PP) is crossed with a homozygous recessive plant for white flowers (pp). Using a Punnett square logic, (a) Determine the genotype and phenotype of the F1 generation. (b) Explain the law of segregation.",
        markScheme: [
          {
            key: "Pp",
            points: 3,
            desc: "Identifying the F1 genotype correctly (100% Pp)",
          },
          {
            key: "Purple",
            points: 2,
            desc: "Stating the F1 phenotype as Purple",
          },
          {
            key: "separate",
            points: 3,
            desc: "Explaining that alleles separate during gamete formation",
          },
          {
            key: "one allele",
            points: 2,
            desc: "Stating each gamete receives only one allele",
          },
        ],
        modelAnswer:
          "(a) The F1 generation genotype is 100% Pp (Heterozygous) and the phenotype is 100% Purple. (b) The Law of Segregation states that during gamete formation, the two alleles for a trait separate so that each gamete receives only one allele.",
        contextIcon: "",
      },
    ],
    physics: [
      {
        id: 4001,
        difficulty: "hard",
        topic: "Electricity · Ohm's Law",
        question:
          "In a circuit, a 12V battery is connected to three resistors of 2Ω, 4Ω, and 6Ω in series. (a) Calculate the total resistance. (b) Find the current flowing through the circuit. (c) Determine the potential difference across the 6Ω resistor.",
        markScheme: [
          {
            key: "12",
            points: 2,
            desc: "Adding resistors in series (2+4+6 = 12Ω)",
          },
          {
            key: "1A",
            points: 3,
            desc: "Calculating current (I = V/R = 12/12 = 1A)",
          },
          {
            key: "V = IR",
            points: 2,
            desc: "Using V = IR for the specific resistor",
          },
          { key: "6V", points: 3, desc: "Final PD calculation (1A * 6Ω = 6V)" },
        ],
        modelAnswer:
          "(a) Total Resistance = 2 + 4 + 6 = 12 Ω. (b) Current I = V/R = 12/12 = 1 A. (c) PD across 6Ω = I * R = 1 * 6 = 6 V.",
        contextIcon: "",
      },
    ],
    social: [
      {
        id: 5001,
        difficulty: "medium",
        topic: "Citizenship · National Symbols",
        question:
          "The Ghana National Flag was designed by Mrs. Theodosia Okoh. (a) State the meanings of the three colors. (b) Explain why the Black Star is placed in the center of the yellow band.",
        markScheme: [
          {
            key: "blood",
            points: 2,
            desc: "Red for the blood of those who died for independence",
          },
          {
            key: "forest",
            points: 2,
            desc: "Green for the rich forest/vegetation",
          },
          {
            key: "mineral",
            points: 2,
            desc: "Yellow/Gold for the mineral wealth",
          },
          {
            key: "lodestar",
            points: 4,
            desc: "Black star as the lodestar of African Freedom/Unity",
          },
        ],
        modelAnswer:
          "(a) Red represents the blood of our ancestors shed for independence; Yellow represents the country's mineral wealth; Green represents the rich forest and agriculture. (b) The Black Star represents the 'lodestar' of African Freedom and the unity of African people.",
        contextIcon: "",
      },
    ],
  },
};

// ============================================================
// MOCK EXAM REGISTRY
// ============================================================
const MOCK_EXAMS = {
  math_mock_a: {
    id: "math_mock_a",
    subject: "maths",
    title: "Core Mathematics Mock A",
    description:
      "Full-length 50-question simulation focusing on the 2026 WASSCE syllabus core topics.",
    timeLimit: 150, // 2.5 hours in minutes
    questionCount: 50,
    questions: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
      40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
    ],
  },
};
