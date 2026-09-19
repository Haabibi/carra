// Editorial reference snapshots, retrieved 2026-09-19. Not live local quotes.
const base = 'https://repairpal.com/estimator/';
const references = {
  pads: { low: 335, high: 394, scope: 'All-vehicle brake pad replacement', url: base + 'brake-pad-replacement-cost' },
  rotors: { low: 574, high: 698, scope: 'All-vehicle brake rotor replacement', url: base + 'brake-rotor-replacement-cost' },
  battery: { low: 456, high: 493, scope: 'All-vehicle conventional battery replacement', url: base + 'battery-replacement-cost' },
  plugs: { low: 288, high: 399, scope: 'All-vehicle spark plug replacement', url: base + 'spark-plug-replacement-cost' },
};
export function itemInsight(item, vehicle = '') {
  const text = item.title.toLowerCase();
  let kind, description, question;
  if (/brake.*pad/.test(text)) { kind = 'pads'; description = 'Brake pads are the friction blocks that press against a spinning metal disc to slow the wheel.'; question = 'What is the remaining pad thickness, and does this price cover both wheels on this axle?'; }
  else if (/rotor|brake disc/.test(text)) { kind = 'rotors'; description = 'The rotor is the metal disc that turns with the wheel. Brake pads grip its surfaces to slow the car.'; question = 'What measurements show the rotor condition, and is the labor shared with the pad replacement?'; }
  else if (/brake.*fluid/.test(text)) { kind = 'fluid'; description = 'Brake fluid carries pressure from the pedal to the brakes at each wheel. A fluid exchange replaces the old fluid.'; question = 'Is this based on a fluid test or the service interval for my vehicle?'; }
  else if (/spark plug/.test(text)) { kind = 'plugs'; description = 'Spark plugs ignite the fuel-and-air mixture inside a gasoline engine. This line refers to those ignition parts.'; question = 'How many plugs are included, and which part specification is quoted?'; }
  else if (/dc.?dc|charging system/.test(text)) { kind = 'charging'; description = 'The charging system keeps the low-voltage battery supplied with power. On an EV, a DC-DC converter feeds it from the larger drive battery.'; question = 'What test results identify the cause, and could the testing fall under a warranty?'; }
  else if (/12.?v|12.?volt|agm|battery/.test(text) && !/traction|high.voltage|hybrid|drive battery/.test(text)) { kind = 'battery'; description = 'The small low-voltage battery powers electronics and helps the vehicle start up. It is different from an EV’s large drive battery.'; question = 'What did the battery test show, and are installation and battery registration included?'; }
  else if (/ignition coil/.test(text)) { kind = 'ignition'; description = 'An ignition coil supplies the electrical pulse that lets a spark plug ignite the fuel mixture.'; question = 'Which coil is involved, and what test identified it?'; }
  else if (/diagnos|inspect|test/.test(text)) { kind = 'testing'; description = 'This is time spent inspecting or testing the car to identify a cause. It is separate from replacing a part.'; question = 'What testing is included, and will you contact me before adding repair work?'; }
  else { return { kind: 'unknown', description: item.plain && !/^Work listed|^An item entered/.test(item.plain) ? item.plain : 'The document names this work but does not describe its scope.', question: 'Which part or service is included, and what finding led to this line?' }; }
  let reference = references[kind];
  if (kind === 'battery' && !/replac/.test(text)) reference = null;
  // Do not compare inspection-only lines, bundled repairs, or traction batteries to replacement prices.
  if (/inspect|diagnos|test|resurfac|machin/.test(text) || (/pad/.test(text) && /rotor|caliper/.test(text))) reference = null;
  if (reference && kind === 'pads' && /volvo\s+xc60/i.test(vehicle)) reference = { low: 289, high: 346, scope: 'Volvo XC60 brake pad replacement', url: base + 'volvo/xc60/brake-pad-replacement-cost' };
  if (reference && kind === 'pads' && /honda\s+cr-v/i.test(vehicle)) reference = { low: 264, high: 321, scope: 'Honda CR-V brake pad replacement', url: base + 'honda/cr-v/brake-pad-replacement-cost' };
  const value = item.total;
  const comparison = reference && typeof value === 'number' && Number.isFinite(value) && value > 0 ? (() => {
    const { low, high } = reference;
    const start = Math.min(low * .55, value * .8), end = Math.max(high * 1.45, value * 1.2);
    const percent = n => (n - start) / (end - start) * 100;
    return { ...reference, position: value < low ? 'Below' : value > high ? 'Above' : 'Within', marker: percent(value), bandStart: percent(low), bandEnd: percent(high), difference: value > high ? value - high : value < low ? low - value : 0 };
  })() : null;
  return { kind, description, question, comparison, source: /pads|rotors|fluid/.test(kind) ? 'https://www.firestonecompleteautocare.com/repair/brakes/how-brakes-work/' : reference?.url };
}
