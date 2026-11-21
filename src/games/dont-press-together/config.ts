import type { DifficultyLevel } from '../../game-engine/types';
import type { DontPressTogetherConfig } from './types';

const CONFIGS: Record<DifficultyLevel, DontPressTogetherConfig> = {
  easy: {
    difficulty: 'easy',
    stages: [
      {
        title: 'Warming the Teapot',
        // Solution: Host A+1 (a=1,b=0) -> Guest B+2 (a=1,b=2) -> Host A+1 (a=2,b=2) -> Target (2,2)
        //Wait: let's make B affect alpha and A affect beta too so neither can solve alone!
        // Host: a+2/b+0 AND b+1/a-1? Let's make it crisp and fun:
        // Initial: alpha=0, beta=0, Target: alpha=2, beta=2.
        // Host switches: S1 (+1 alpha, +1 beta), S2 (-1 alpha, +1 beta) -> only reachable: if S1+B1: B1 (+1 alpha, -1 beta)? Let's solve algebraically!
        // Host S1: alpha +1, beta +1; Host S2: alpha -1, beta +0
        // Guest G1: alpha +0, beta +2; Guest G2: alpha +1, beta -1
        // Example: S1 -> alpha=1,beta=1; G2 -> alpha=2,beta=0; G1 -> alpha=2,beta=2! Cannot reach (2,2) by A alone because A max beta diff per alpha is 1:1 (only 1 step? well S1,S1 reaches (2,2) if unclamped!).
        // Better: make Host ONLY change alpha directly or couple it so Host CANNOT satisfy target beta without Guest!
        // Host S1: alpha +2; Host S2: alpha -1
        // Guest G1: beta +2, alpha -1; Guest G2: beta +1
        // Target: alpha=2, beta=3! Host can't change beta at all! Guest can reach beta=3 cleanly with G1+G2 (alpha=-1, beta=3) + Host S1+S1-S2 (alpha=2) = (2,3)!
        // Let's also guard G1: requires alpha >= 1 so A must prime alpha first!
        variables: [
          { key: 'alpha', label: 'Steam', min: 0, max: 4, initial: 0, target: 2 },
          { key: 'beta', label: 'Glow', min: 0, max: 4, initial: 0, target: 3 },
        ],
        buttons: [
          {
            id: 's1',
            owner: 'host',
            label: 'Boiler +2',
            color: 'pink',
            effectSummary: 'Steam +2',
            deltas: { alpha: 2 },
          },
          {
            id: 's2',
            owner: 'host',
            label: 'Vent -1',
            color: 'sky',
            effectSummary: 'Steam -1',
            deltas: { alpha: -1 },
          },
          {
            id: 'g1',
            owner: 'guest',
            label: 'Prism Surge',
            color: 'mint',
            effectSummary: 'Glow +2, Steam -1',
            deltas: { beta: 2, alpha: -1 },
            requires: {
              key: 'alpha',
              min: 1,
              ruleText: 'Needs Steam >= 1 first!',
            },
          },
          {
            id: 'g2',
            owner: 'guest',
            label: 'Candle +1',
            color: 'amber',
            effectSummary: 'Glow +1',
            deltas: { beta: 1 },
          },
        ],
        hazardRuleHint: 'Prism Surge needs Steam >= 1 or the boiler sputters!',
        hintSuggestion: 'Host boosts Steam first (Boiler +2), then Guest uses Prism Surge + Candle +1, then Host adjusts Steam to 2.',
      },
      {
        title: 'Cookie Oven Latch',
        // Initial: alpha=1, beta=0, Target: alpha=3, beta=2
        // Host controls Steam (alpha): H1 (+2 alpha), H2 (-1 alpha, +1 beta)
        // Guest controls Timer (beta): G1 (+2 beta), G2 (+1 alpha, -1 beta)
        // Target (3,2): Notice H1+H2 => alpha=2,beta=1, then G1 => beta=3 (over), G2 => alpha=3,beta=2! Or H1 (3,0) -> G1 (3,2)! Wait if H1(3,0)->G1(3,2), forbid G1 unless alpha >= 2 AND don't allow immediate press hazard?
        // Make Guest ONLY own Glow/Oven Heat & Host own Steam, and both needed:
        // Initial: alpha=1, beta=1. Target: alpha=2, beta=4.
        // H1: alpha +2; H2: alpha -1
        // G1: beta +3, alpha -1 (requires alpha >= 2); G2: beta +1
        // Path: H1 (3,1) -> G1 (2,4)! Exact 2 moves! Or H1 -> H2 -> ... many paths work!
        variables: [
          { key: 'alpha', label: 'Heat', min: 0, max: 4, initial: 1, target: 2 },
          { key: 'beta', label: 'Crisp', min: 0, max: 4, initial: 1, target: 4 },
        ],
        buttons: [
          {
            id: 'h_heat_up',
            owner: 'host',
            label: 'Burner +2',
            color: 'pink',
            effectSummary: 'Heat +2',
            deltas: { alpha: 2 },
          },
          {
            id: 'h_heat_down',
            owner: 'host',
            label: 'Fan -1',
            color: 'sky',
            effectSummary: 'Heat -1',
            deltas: { alpha: -1 },
          },
          {
            id: 'g_bake',
            owner: 'guest',
            label: 'Gold Bake',
            color: 'amber',
            effectSummary: 'Crisp +3, Heat -1',
            deltas: { beta: 3, alpha: -1 },
            requires: {
              key: 'alpha',
              min: 2,
              ruleText: 'Oven Heat must be >= 2!',
            },
          },
          {
            id: 'g_toast',
            owner: 'guest',
            label: 'Warm +1',
            color: 'mint',
            effectSummary: 'Crisp +1',
            deltas: { beta: 1 },
          },
        ],
        hazardRuleHint: 'Do not press Gold Bake when Heat is below 2!',
        hintSuggestion: 'Host raises Heat to 3, then Guest hits Gold Bake once to hit (Heat 2, Crisp 4)!',
      },
      {
        title: 'Mailbox Chime',
        // Initial: alpha=0, beta=2. Target: alpha=3, beta=1.
        // H1: alpha +2, beta -1 (requires beta >= 1); H2: alpha -1
        // G1: beta +2; G2: beta -2, alpha +1
        // Path: G2 (1,0) -> G1 (1,2) -> H1 (3,1)! Or H1 (2,1) -> G2 (3,-1 invalid!) -> Wait: H1 (2,1) -> G1 (2,3) -> G2 (3,1)!
        variables: [
          { key: 'alpha', label: 'Chime', min: 0, max: 4, initial: 0, target: 3 },
          { key: 'beta', label: 'Spring', min: 0, max: 4, initial: 2, target: 1 },
        ],
        buttons: [
          {
            id: 'h_ring',
            owner: 'host',
            label: 'Bell Coil',
            color: 'pink',
            effectSummary: 'Chime +2, Spring -1',
            deltas: { alpha: 2, beta: -1 },
            requires: {
              key: 'beta',
              min: 1,
              ruleText: 'Needs Spring >= 1!',
            },
          },
          {
            id: 'h_damp',
            owner: 'host',
            label: 'Soften -1',
            color: 'sky',
            effectSummary: 'Chime -1',
            deltas: { alpha: -1 },
          },
          {
            id: 'g_wind',
            owner: 'guest',
            label: 'Wind +2',
            color: 'mint',
            effectSummary: 'Spring +2',
            deltas: { beta: 2 },
          },
          {
            id: 'g_snap',
            owner: 'guest',
            label: 'Snap Chime',
            color: 'amber',
            effectSummary: 'Chime +1, Spring -2',
            deltas: { alpha: 1, beta: -2 },
            requires: {
              key: 'beta',
              min: 2,
              ruleText: 'Needs Spring >= 2!',
            },
          },
        ],
        hazardRuleHint: 'Check Spring tension before Bell Coil or Snap Chime!',
        hintSuggestion: 'Host presses Bell Coil (2,1), Guest presses Wind +2 (2,3), then Guest presses Snap Chime (3,1).',
      },
    ],
  },
  medium: {
    difficulty: 'medium',
    stages: [
      {
        title: 'Triple Valve Lock',
        // 3 vars: alpha(0->2), beta(0->2), gamma(1->3)
        // H1: alpha +2; H2: gamma +2, alpha -1 (requires alpha >= 1)
        // G1: beta +2, gamma -1 (requires gamma >= 1); G2: gamma +1; G3: beta -1
        // Path: H1 (2,0,1) -> H2 (1,0,3) -> G1 (1,2,2) -> G2 (1,2,3) -> wait alpha=1, need alpha=2 -> H1 (3,2,3) over!
        // Make H3: alpha -1!
        // Let's trace: H1 (2,0,1) -> G1 (2,2,0) -> H2 (1,2,2) -> H1 (3,2,2) -> H3 (2,2,2) -> G2 (2,2,3)!
        // Or simpler:
        // H1: alpha +2
        // H2: alpha -1
        // H3: gamma +2 (requires alpha >= 2)
        // G1: beta +2, gamma -1
        // G2: gamma +1
        // G3: beta -1
        // Trace from (0,0,1) -> (2,2,3):
        // H1 -> (2,0,1); G1 -> (2,2,0); H3 -> (2,2,2); G2 -> (2,2,3)! Clean!
        variables: [
          { key: 'alpha', label: 'A-Valve', min: 0, max: 4, initial: 0, target: 2 },
          { key: 'beta', label: 'B-Valve', min: 0, max: 4, initial: 0, target: 2 },
          { key: 'gamma', label: 'C-Valve', min: 0, max: 4, initial: 1, target: 3 },
        ],
        buttons: [
          {
            id: 'm1_ha',
            owner: 'host',
            label: 'A +2',
            color: 'pink',
            effectSummary: 'A-Valve +2',
            deltas: { alpha: 2 },
          },
          {
            id: 'm1_hm',
            owner: 'host',
            label: 'A -1',
            color: 'sky',
            effectSummary: 'A-Valve -1',
            deltas: { alpha: -1 },
          },
          {
            id: 'm1_hc',
            owner: 'host',
            label: 'C Boost +2',
            color: 'amber',
            effectSummary: 'C-Valve +2',
            deltas: { gamma: 2 },
            requires: {
              key: 'alpha',
              min: 2,
              ruleText: 'Requires A-Valve >= 2!',
            },
          },
          {
            id: 'm1_gb',
            owner: 'guest',
            label: 'Transfer B',
            color: 'mint',
            effectSummary: 'B-Valve +2, C-Valve -1',
            deltas: { beta: 2, gamma: -1 },
            requires: {
              key: 'gamma',
              min: 1,
              ruleText: 'Requires C-Valve >= 1!',
            },
          },
          {
            id: 'm1_gc',
            owner: 'guest',
            label: 'C Drip +1',
            color: 'amber',
            effectSummary: 'C-Valve +1',
            deltas: { gamma: 1 },
          },
          {
            id: 'm1_gb_sub',
            owner: 'guest',
            label: 'B Bleed -1',
            color: 'sky',
            effectSummary: 'B-Valve -1',
            deltas: { beta: -1 },
          },
        ],
        hazardRuleHint: 'C Boost needs A-Valve >= 2. Transfer B drains 1 from C-Valve!',
        hintSuggestion: 'Host raises A +2, Guest hits Transfer B, Host hits C Boost +2, Guest taps C Drip +1.',
      },
      {
        title: 'Greenhouse Mist',
        // 3 vars: alpha(1->3), beta(2->1), gamma(0->2)
        // H1: alpha +1, beta -1 (requires beta >= 1)
        // H2: alpha +2
        // H3: beta +1
        // G1: gamma +2, alpha -1 (requires alpha >= 2)
        // G2: beta -1
        // G3: gamma -1
        // Trace from (1,2,0) -> (3,1,2):
        // H2 (3,2,0) -> G1 (2,2,2) -> H1 (3,1,2)! Or H1(2,1,0) -> G1(1,1,2) -> H2(3,1,2)!
        variables: [
          { key: 'alpha', label: 'Sun', min: 0, max: 4, initial: 1, target: 3 },
          { key: 'beta', label: 'Soil', min: 0, max: 4, initial: 2, target: 1 },
          { key: 'gamma', label: 'Mist', min: 0, max: 4, initial: 0, target: 2 },
        ],
        buttons: [
          {
            id: 'm2_h1',
            owner: 'host',
            label: 'Solar Dry',
            color: 'amber',
            effectSummary: 'Sun +1, Soil -1',
            deltas: { alpha: 1, beta: -1 },
            requires: {
              key: 'beta',
              min: 1,
              ruleText: 'Needs Soil >= 1!',
            },
          },
          {
            id: 'm2_h2',
            owner: 'host',
            label: 'Lamp +2',
            color: 'pink',
            effectSummary: 'Sun +2',
            deltas: { alpha: 2 },
          },
          {
            id: 'm2_h3',
            owner: 'host',
            label: 'Compost +1',
            color: 'mint',
            effectSummary: 'Soil +1',
            deltas: { beta: 1 },
          },
          {
            id: 'm2_g1',
            owner: 'guest',
            label: 'Cool Fog',
            color: 'sky',
            effectSummary: 'Mist +2, Sun -1',
            deltas: { gamma: 2, alpha: -1 },
            requires: {
              key: 'alpha',
              min: 2,
              ruleText: 'Needs Sun >= 2!',
            },
          },
          {
            id: 'm2_g2',
            owner: 'guest',
            label: 'Drain -1',
            color: 'amber',
            effectSummary: 'Soil -1',
            deltas: { beta: -1 },
          },
          {
            id: 'm2_g3',
            owner: 'guest',
            label: 'Fan -1',
            color: 'pink',
            effectSummary: 'Mist -1',
            deltas: { gamma: -1 },
          },
        ],
        hazardRuleHint: 'Cool Fog shuts down unless Sun >= 2!',
        hintSuggestion: 'Host uses Solar Dry (2,1,0), Guest activates Cool Fog (1,1,2), then Host hits Lamp +2 (3,1,2).',
      },
      {
        title: 'Starlight Organ',
        // Initial: (0,1,2) -> Target: (3,3,1)
        // H1: alpha +2
        // H2: gamma -1, beta +1
        // H3: alpha -1
        // G1: beta +2, alpha -1 (requires alpha >= 1)
        // G2: alpha +1, gamma -1 (requires gamma >= 2)
        // G3: gamma +1
        // Trace (0,1,2) -> (3,3,1):
        // H1(2,1,2) -> G1(1,3,2) -> G2(2,3,1) -> wait alpha=2, we want (3,3,1)!
        // Try: H1(2,1,2) -> H1(4,1,2) -> G1(3,3,2) -> H2? beta=4. No: G3(3,3,3) no.
        // Try: G2(1,1,1) -> H1(3,1,1) -> H2? needs gamma=2: G3(3,1,2) -> H2(3,2,1)? Need beta+2: G1 -> (2,3,2) ...
        // Better: make G1 give beta +2, gamma -1 (requires alpha >= 2), and G2 give alpha +1!
        // Let's trace with G1=(beta+2, gamma-1, req alpha>=2) & G2=(alpha+1):
        // Start (0,1,2): H1(2,1,2) -> G1(2,3,1) -> G2(3,3,1)! Target reached in 3 crisp moves!
        variables: [
          { key: 'alpha', label: 'Bass', min: 0, max: 4, initial: 0, target: 3 },
          { key: 'beta', label: 'Chord', min: 0, max: 4, initial: 1, target: 3 },
          { key: 'gamma', label: 'Echo', min: 0, max: 4, initial: 2, target: 1 },
        ],
        buttons: [
          {
            id: 'm3_h1',
            owner: 'host',
            label: 'Bass +2',
            color: 'pink',
            effectSummary: 'Bass +2',
            deltas: { alpha: 2 },
          },
          {
            id: 'm3_h2',
            owner: 'host',
            label: 'Mute -1',
            color: 'sky',
            effectSummary: 'Bass -1',
            deltas: { alpha: -1 },
          },
          {
            id: 'm3_h3',
            owner: 'host',
            label: 'Resonate',
            color: 'amber',
            effectSummary: 'Chord +1, Echo -1',
            deltas: { beta: 1, gamma: -1 },
          },
          {
            id: 'm3_g1',
            owner: 'guest',
            label: 'Harpsichord',
            color: 'mint',
            effectSummary: 'Chord +2, Echo -1',
            deltas: { beta: 2, gamma: -1 },
            requires: {
              key: 'alpha',
              min: 2,
              ruleText: 'Needs Bass >= 2!',
            },
          },
          {
            id: 'm3_g2',
            owner: 'guest',
            label: 'Sub Bass +1',
            color: 'pink',
            effectSummary: 'Bass +1',
            deltas: { alpha: 1 },
          },
          {
            id: 'm3_g3',
            owner: 'guest',
            label: 'Reverb +1',
            color: 'sky',
            effectSummary: 'Echo +1',
            deltas: { gamma: 1 },
          },
        ],
        hazardRuleHint: 'Harpsichord jams unless Bass >= 2!',
        hintSuggestion: 'Host raises Bass +2, then Guest plays Harpsichord followed by Sub Bass +1.',
      },
    ],
  },
  hard: {
    difficulty: 'hard',
    stages: [
      {
        title: 'Heart Vault Core',
        // 4 variables: alpha, beta, gamma, delta
        // Notice: forbidImmediatePartnerFollow on special vault locks makes players literally "Don't Press Together"!
        // Start: (0,0,1,2) -> Target: (3,2,2,1)
        // Host:
        //   h_a: alpha +2
        //   h_d: delta -1, gamma +1 (requires alpha >= 2)
        //   h_x: alpha -1
        // Guest:
        //   g_b: beta +2, alpha -1 (requires gamma >= 2, forbidImmediatePartnerFollow: false? Wait let's only add forbidImmediatePartnerFollow on 1 boost or keep deterministic cooldown clear!)
        // If forbidImmediatePartnerFollow is true on g_surge, pressing it directly after Host triggers "Surge Clash! Wait or press another Guest button first!"
        // Let's trace (0,0,1,2) -> (3,2,2,1):
        // 1. Host h_a -> (2,0,1,2)
        // 2. Host h_d -> (2,0,2,1)
        // 3. Guest g_b (beta +2, gamma +0, alpha -1? Wait if alpha becomes 1, need alpha+2 later!)
        // Make g_b: beta +2, delta -0 (requires gamma >= 2, forbidImmediatePartnerFollow: false) -> wait let's keep g_c +alpha so B helps A too:
        // 1. Host h_a -> (2,0,1,2)
        // 2. Host h_d -> (2,0,2,1)
        // 3. Guest g_b: beta +2 (requires gamma >= 2) -> (2,2,2,1)
        // 4. Guest g_a: alpha +1 -> (3,2,2,1)!
        // Let's also put forbidImmediatePartnerFollow on g_b? Wait if Host just pressed h_d, then Guest pressing g_b immediately would clash!
        // Instead, put forbidImmediatePartnerFollow on g_a! Then Guest presses g_b first (safe), THEN Guest presses g_a (not immediate after Host)! Wait that showcases "Don't Press Together" super well cleanly and deterministically!
        variables: [
          { key: 'alpha', label: 'Core', min: 0, max: 4, initial: 0, target: 3 },
          { key: 'beta', label: 'Pulse', min: 0, max: 4, initial: 0, target: 2 },
          { key: 'gamma', label: 'Shield', min: 0, max: 4, initial: 1, target: 2 },
          { key: 'delta', label: 'Latch', min: 0, max: 4, initial: 2, target: 1 },
        ],
        buttons: [
          {
            id: 'hv1_a',
            owner: 'host',
            label: 'Core +2',
            color: 'pink',
            effectSummary: 'Core +2',
            deltas: { alpha: 2 },
          },
          {
            id: 'hv1_d',
            owner: 'host',
            label: 'Shift Shield',
            color: 'amber',
            effectSummary: 'Shield +1, Latch -1',
            deltas: { gamma: 1, delta: -1 },
            requires: {
              key: 'alpha',
              min: 2,
              ruleText: 'Needs Core >= 2!',
            },
          },
          {
            id: 'hv1_am',
            owner: 'host',
            label: 'Core -1',
            color: 'sky',
            effectSummary: 'Core -1',
            deltas: { alpha: -1 },
          },
          {
            id: 'hv1_gb',
            owner: 'guest',
            label: 'Pulse +2',
            color: 'mint',
            effectSummary: 'Pulse +2',
            deltas: { beta: 2 },
            requires: {
              key: 'gamma',
              min: 2,
              ruleText: 'Needs Shield >= 2!',
            },
          },
          {
            id: 'hv1_ga',
            owner: 'guest',
            label: 'Spark Core +1',
            color: 'pink',
            effectSummary: 'Core +1 (No immediate Host follow!)',
            deltas: { alpha: 1 },
            forbidImmediatePartnerFollow: true,
          },
          {
            id: 'hv1_gd',
            owner: 'guest',
            label: 'Reset Latch +1',
            color: 'sky',
            effectSummary: 'Latch +1',
            deltas: { delta: 1 },
          },
        ],
        hazardRuleHint: 'Do NOT press Spark Core right after Host presses — buffer with Pulse +2 first!',
        hintSuggestion: 'Host: Core +2 then Shift Shield -> Guest: Pulse +2 then Spark Core +1.',
      },
      {
        title: 'Clockwork Greenhouse',
        // Start: (1,1,0,3) -> Target: (2,3,2,1)
        // Trace:
        // Host h1: alpha +2, delta -1 -> (3,1,0,2)
        // Guest g1: gamma +2, alpha -1 (requires alpha >= 3) -> (2,1,2,2)
        // Guest g2: beta +2, delta -1 (requires gamma >= 2, forbidImmediatePartnerFollow) -> safe since Guest just pressed g1! -> (2,3,2,1)!!
        variables: [
          { key: 'alpha', label: 'Gear', min: 0, max: 4, initial: 1, target: 2 },
          { key: 'beta', label: 'Bloom', min: 0, max: 4, initial: 1, target: 3 },
          { key: 'gamma', label: 'Dew', min: 0, max: 4, initial: 0, target: 2 },
          { key: 'delta', label: 'Weight', min: 0, max: 4, initial: 3, target: 1 },
        ],
        buttons: [
          {
            id: 'hv2_h1',
            owner: 'host',
            label: 'Wind Gear',
            color: 'pink',
            effectSummary: 'Gear +2, Weight -1',
            deltas: { alpha: 2, delta: -1 },
          },
          {
            id: 'hv2_h2',
            owner: 'host',
            label: 'Add Weight +1',
            color: 'sky',
            effectSummary: 'Weight +1',
            deltas: { delta: 1 },
          },
          {
            id: 'hv2_h3',
            owner: 'host',
            label: 'Brake -1',
            color: 'amber',
            effectSummary: 'Gear -1',
            deltas: { alpha: -1 },
          },
          {
            id: 'hv2_g1',
            owner: 'guest',
            label: 'Mist Valve',
            color: 'sky',
            effectSummary: 'Dew +2, Gear -1',
            deltas: { gamma: 2, alpha: -1 },
            requires: {
              key: 'alpha',
              min: 3,
              ruleText: 'Needs Gear >= 3!',
            },
          },
          {
            id: 'hv2_g2',
            owner: 'guest',
            label: 'Bloom Surge',
            color: 'mint',
            effectSummary: 'Bloom +2, Weight -1 (No immediate Host follow!)',
            deltas: { beta: 2, delta: -1 },
            requires: {
              key: 'gamma',
              min: 2,
              ruleText: 'Needs Dew >= 2!',
            },
            forbidImmediatePartnerFollow: true,
          },
          {
            id: 'hv2_g3',
            owner: 'guest',
            label: 'Trim Bloom -1',
            color: 'pink',
            effectSummary: 'Bloom -1',
            deltas: { beta: -1 },
          },
        ],
        hazardRuleHint: 'Mist Valve needs Gear >= 3. Bloom Surge fails if pressed right after Host!',
        hintSuggestion: 'Host winds Gear -> Guest presses Mist Valve -> Guest presses Bloom Surge.',
      },
      {
        title: 'Heart Beacon Final',
        // Start: (2,0,2,0) -> Target: (1,3,3,2)
        // Trace:
        // Host h1 (forbidImmediatePartnerFollow false): delta +2, alpha -1 -> (1,0,2,2)
        // Guest g1 (requires delta >= 2): beta +2 -> (1,2,2,2)
        // Guest g2 (forbidImmediatePartnerFollow true, requires beta >= 2): gamma +1, beta +1 -> (1,3,3,2)!
        variables: [
          { key: 'alpha', label: 'Flux', min: 0, max: 4, initial: 2, target: 1 },
          { key: 'beta', label: 'Beam', min: 0, max: 4, initial: 0, target: 3 },
          { key: 'gamma', label: 'Prism', min: 0, max: 4, initial: 2, target: 3 },
          { key: 'delta', label: 'Anchor', min: 0, max: 4, initial: 0, target: 2 },
        ],
        buttons: [
          {
            id: 'hv3_h1',
            owner: 'host',
            label: 'Drop Anchor',
            color: 'amber',
            effectSummary: 'Anchor +2, Flux -1',
            deltas: { delta: 2, alpha: -1 },
          },
          {
            id: 'hv3_h2',
            owner: 'host',
            label: 'Flux +1',
            color: 'pink',
            effectSummary: 'Flux +1',
            deltas: { alpha: 1 },
          },
          {
            id: 'hv3_h3',
            owner: 'host',
            label: 'Dim Beam -1',
            color: 'sky',
            effectSummary: 'Beam -1',
            deltas: { beta: -1 },
          },
          {
            id: 'hv3_g1',
            owner: 'guest',
            label: 'Focus Beam',
            color: 'mint',
            effectSummary: 'Beam +2',
            deltas: { beta: 2 },
            requires: {
              key: 'delta',
              min: 2,
              ruleText: 'Needs Anchor >= 2!',
            },
          },
          {
            id: 'hv3_g2',
            owner: 'guest',
            label: 'Harmonic Lock',
            color: 'pink',
            effectSummary: 'Prism +1, Beam +1 (No immediate Host follow!)',
            deltas: { gamma: 1, beta: 1 },
            requires: {
              key: 'beta',
              min: 2,
              ruleText: 'Needs Beam >= 2!',
            },
            forbidImmediatePartnerFollow: true,
          },
          {
            id: 'hv3_g3',
            owner: 'guest',
            label: 'Release Anchor -1',
            color: 'amber',
            effectSummary: 'Anchor -1',
            deltas: { delta: -1 },
          },
        ],
        hazardRuleHint: 'Do NOT trigger Harmonic Lock right after Host acts, and Anchor must be >= 2 first!',
        hintSuggestion: 'Host drops Anchor (1,0,2,2), Guest focuses Beam (1,2,2,2), then Guest hits Harmonic Lock (1,3,3,2).',
      },
    ],
  },
};

export function getDontPressConfig(difficulty: DifficultyLevel): DontPressTogetherConfig {
  return CONFIGS[difficulty];
}
