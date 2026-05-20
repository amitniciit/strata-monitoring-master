function getInstrumentConversion(abbreviation) {
    const instruments = {
      DHT: { fullForm: 'Dual height tell tail', unit: 'mm' },
      SHT: { fullForm: 'Single height tell tail', unit: 'mm' },
      RTT: { fullForm: 'Rotary tell tail', unit: '°' },
      AWTT: { fullForm: 'Auto warning tell tail', unit: 'units' },
      SC: { fullForm: 'Stress cells', unit: 'MPa' },
      LC: { fullForm: 'Load cells', unit: 'kg' },
      RFC: { fullForm: 'Roof-Floor convergence', unit: 'mm' },
      MPBX: { fullForm: 'Multipoint borehole extensometer', unit: 'mm' },
      CRI: { fullForm: 'Convergence rate indicator', unit: 'mm/yr' }
    };
  
    return instruments[abbreviation] || { fullForm: 'Abbreviation not found', unit: '' };
  }
  
module.exports=getInstrumentConversion;