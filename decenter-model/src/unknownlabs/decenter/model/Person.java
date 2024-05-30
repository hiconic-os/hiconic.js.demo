package hiconic.js.demo.decenter.model;

import java.util.Date;

import com.braintribe.model.generic.GenericEntity;
import com.braintribe.model.generic.reflection.EntityType;
import com.braintribe.model.generic.reflection.EntityTypes;

public interface Person extends GenericEntity {
	EntityType<Person> T = EntityTypes.T(Person.class);
	
	String name = "name";
	String lastName = "lastName";
	String birthday = "birthday";
	String email = "email";
	
	String getName();
	void setName(String name);
	
	String getLastName();
	void setLastName(String lastName);
	
	Date getBirthday();
	void setBirthday(Date birthday);
	
	String getEmail();
	void setEmail(String email);
}