// ============================================================================
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ============================================================================
package hiconic.js.demo.decenter.model;

import java.util.Date;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;
import java.util.List;

import com.braintribe.model.generic.GenericEntity;
import com.braintribe.model.generic.reflection.EntityType;
import com.braintribe.model.generic.reflection.EntityTypes;

public interface JackOfAllTraits extends GenericEntity {
	EntityType<JackOfAllTraits> T = EntityTypes.T(JackOfAllTraits.class);
	
	Object getObjectValue();
	void setObjectValue(Object objectValue);

	String getStringValue();
	void setStringValue(String stringValue);
	
	boolean getBooleanValue();
	void setBooleanValue(boolean booleanValue);

	double getDoubleValue();
	void setDoubleValue(double doubleValue);

	float getFloatValue();
	void setFloatValue(float floatValue);

	int getIntegerValue();
	void setIntegerValue(int integerValue);

	long getLongValue();
	void setLongValue(long longValue);

	BigDecimal getDecimalValue();
	void setDecimalValue(BigDecimal longValue);
	
	Date getDateValue();
	void setDateValue(Date dateValue);

	List<JackOfAllTraits> getEntityList();	
	void setEntityList(List<JackOfAllTraits> entityList);	

	Set<JackOfAllTraits> getEntitySet();	
	void setEntitySet(Set<JackOfAllTraits> entityList);	

	Map<String,JackOfAllTraits> getEntityMap();	
	void setEntityMap(Map<String,JackOfAllTraits> entityMap);	
	
	List<String> getStringList();
	void setStringList(List<String> stringList);
	
	Set<Integer> getIntegerSet();
	void setIntegerSet(Set<Integer> integerSet);
	
	Map<String,Long> getLongMap();
	void setLongMap(Map<String,Long> longMap);
}