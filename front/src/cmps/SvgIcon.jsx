import React from 'react';
import { svgService } from '../services/svg.service';

function svgIcon({ iconName }) {
//  console.log('iconName:', iconName);
 const svg = svgService.getSvg(iconName);

 return (
  <i dangerouslySetInnerHTML={{ __html: svg }} className='svg-icon'></i>
 );
}

export default svgIcon;
