# **Admin api documentation**

# **1\. Analytics Dashboard**

### **GET `/analytics/dashboard`**

**Request**

GET /analytics/dashboard  
Authorization: Bearer \<token\>  
Accept: application/json

**Response 200**

{  
  "message": "string",  
  "data": "string"  
}

**Response 401**

{  
  "message": "string"  
}  
---

# **2\. Website Settings**

### **POST `/website-settings`**

**Request**

لا يوجد Request Body في الـ Collection.

**Response 200**

{  
  "data": {  
    "id": 2802,  
    "site\_name": "string",  
    "email": null,  
    "phone": null,  
    "address": "string",  
    "logo": null,  
    "homepage\_banner": "string",  
    "social\_media\_links": \[  
      {  
        "id": 6849,  
        "website\_setting\_id": 5232,  
        "type": "string",  
        "link": "string",  
        "created\_at": "2000-09-30T09:45:18.611Z",  
        "updated\_at": null  
      },  
      {  
        "id": 1574,  
        "website\_setting\_id": 9805,  
        "type": "string",  
        "link": "string",  
        "created\_at": null,  
        "updated\_at": null  
      }  
    \]  
  }  
}

**Response 401**

{  
  "message": "string"  
}

**Response 422**

{  
  "message": "string",  
  "errors": {  
    "key\_0": \[  
      "string",  
      "string"  
    \]  
  }  
}

**Response 500**

{  
  "message": "string"  
}

### **PUT `/website-settings/{websiteSetting}`**

**Request**

لا يوجد Body في الـ Collection.

**Response 200**

{  
  "data": {  
    "id": 2802,  
    "site\_name": "string",  
    "email": null,  
    "phone": null,  
    "address": "string",  
    "logo": null,  
    "homepage\_banner": "string",  
    "social\_media\_links": \[  
      {  
        "id": 6849,  
        "website\_setting\_id": 5232,  
        "type": "string",  
        "link": "string",  
        "created\_at": "2000-09-30T09:45:18.611Z",  
        "updated\_at": null  
      }  
    \]  
  }  
}

**Response 401**

{  
  "message": "string"  
}

**Response 404**

{  
  "message": "string"  
}

**Response 422**

{  
  "message": "string",  
  "errors": {  
    "key\_0": \[  
      "string",  
      "string"  
    \]  
  }  
}

**Response 500**

{  
  "message": "string"  
}

### **DELETE `/website-settings/{websiteSetting}`**

**Request**

DELETE /website-settings/{websiteSetting}  
Authorization: Bearer \<token\>  
Accept: application/json

**Response 200**

{  
  "message": "string"  
}

**Response 401**

{  
  "message": "string"  
}

**Response 404**

{  
  "message": "string"  
}  
---

# **3\. Hotels**

### **POST `/hotels`**

**Request**

{  
  "name": "string",  
  "city": "string",  
  "price\_per\_night": 3421,  
  "available\_rooms": 9997,  
  "neighborhood": null,  
  "distance\_km": 8593.538727039715,  
  "rating": 4.390127552556412,  
  "review\_count": null,  
  "amenities": "string"  
}

### **PUT `/hotels/{id}`**

**Request**

{  
  "name": "string",  
  "city": "string",  
  "neighborhood": null,  
  "distance\_km": 9330.145196162053,  
  "price\_per\_night": 4583,  
  "rating": null,  
  "review\_count": null,  
  "amenities": null,  
  "available\_rooms": 4655  
}

### **DELETE `/hotels/{id}`**

**Request**

DELETE /hotels/{id}  
Authorization: Bearer \<token\>  
Accept: application/json

**Response 200**

{  
  "message": "string"  
}

**Response 401**

{  
  "message": "string"  
}

**Response 404**

{  
  "message": "string"  
}  
---

# **4\. Restaurants**

### **POST `/restaurants`**

**Request**

{  
  "name": "string",  
  "city": "string",  
  "address": "string",  
  "average\_cost\_for\_two": 1672,  
  "price\_range": 3,  
  "locality": "string",  
  "latitude": null,  
  "longitude": null,  
  "cuisines": "string",  
  "currency": "string",  
  "has\_table\_booking": false,  
  "has\_online\_delivery": false,  
  "is\_delivering\_now": false,  
  "rating": null,  
  "votes": 2124  
}

### **PUT `/restaurants/{id}`**

**Request**

{  
  "name": "string",  
  "city": "string",  
  "address": "string",  
  "locality": null,  
  "latitude": null,  
  "longitude": null,  
  "cuisines": null,  
  "average\_cost\_for\_two": 8384,  
  "currency": null,  
  "has\_table\_booking": true,  
  "has\_online\_delivery": false,  
  "is\_delivering\_now": false,  
  "price\_range": 4,  
  "rating": 0.12209237992345412,  
  "votes": 9497  
}  
---

# **5\. Trips Admin**

### **GET `/trips-admin`**

**Request**

GET /trips-admin  
Authorization: Bearer \<token\>  
Accept: application/json

**Response 200**

{  
  "success": true,  
  "message": "string",  
  "data": \[  
    {  
      "id": 3815,  
      "num\_days": "string",  
      "travel\_style": "string",  
      "dis\_country": "string",  
      "budget": "string",  
      "interst": "string",  
      "number\_of\_travelers": 4893,  
      "created\_at": null,  
      "user": {  
        "id": 7217,  
        "name": "string",  
        "email": "string",  
        "age": "string",  
        "dist\_country": "string",  
        "gender": null,  
        "role": "string",  
        "phone\_num": null,  
        "email\_verified\_at": "2015-12-05T00:35:07.536Z",  
        "created\_at": "2020-06-23T02:59:08.482Z",  
        "updated\_at": null,  
        "is\_active": 5289  
      }  
    }  
  \],  
  "meta": {  
    "current\_page": 157,  
    "last\_page": 9631,  
    "per\_page": 1916,  
    "total": 4290  
  }  
}

**Response 401**

{  
  "message": "string"  
}

### **GET `/trips-admin/statistics`**

**Response 200**

{  
  "success": false,  
  "message": "string",  
  "data": {  
    "total\_trips": 3768,  
    "trips\_created\_today": 470,  
    "trips\_this\_month": 1866,  
    "latest\_trips": \[  
      {  
        "id": 8714,  
        "num\_days": "string",  
        "travel\_style": "string",  
        "dis\_country": "string",  
        "budget": "string",  
        "interst": "string",  
        "number\_of\_travelers": 5357,  
        "created\_at": "1984-02-21T18:16:02.485Z",  
        "updated\_at": "1970-08-24T12:10:55.221Z",  
        "user\_id": 7305  
      }  
    \],  
    "top\_users": \[  
      {  
        "id": 1988,  
        "name": "string",  
        "email": "string",  
        "age": "string",  
        "dist\_country": null,  
        "gender": "string",  
        "role": "string",  
        "phone\_num": null,  
        "email\_verified\_at": null,  
        "created\_at": null,  
        "updated\_at": null,  
        "is\_active": 4109  
      }  
    \]  
  }  
}

### **PUT `/trips-admin/{trip}`**

**Request**

{  
  "num\_days": null,  
  "travel\_style": "string",  
  "dis\_country": "string",  
  "budget": null,  
  "interst": "string",  
  "number\_of\_travelers": null,  
  "user\_id": 5248  
}

**Response 200**

{  
  "success": false,  
  "message": "string",  
  "data": {  
    "id": 5497,  
    "num\_days": "string",  
    "travel\_style": "string",  
    "dis\_country": "string",  
    "budget": "string",  
    "interst": "string",  
    "number\_of\_travelers": 3713,  
    "created\_at": null,  
    "user": {  
      "id": 2791,  
      "name": "string",  
      "email": "string",  
      "age": "string",  
      "dist\_country": "string",  
      "gender": "string",  
      "role": "string",  
      "phone\_num": null,  
      "email\_verified\_at": null,  
      "created\_at": "1971-04-24T05:14:46.455Z",  
      "updated\_at": "1979-07-10T09:16:35.409Z",  
      "is\_active": 8344  
    }  
  }  
}

**Response 401**

{  
  "message": "string"  
}

**Response 404**

{  
  "message": "string"  
}

**Response 422**

{  
  "message": "string",  
  "errors": {  
    "key\_0": \[  
      "string",  
      "string"  
    \]  
  }  
}

### **DELETE `/trips-admin/{trip}`**

**Response 200**

{  
  "success": true,  
  "message": "string"  
}

**Response 401**

{  
  "message": "string"  
}

**Response 404**

{  
  "message": "string"  
}  
---

# **6\. Attractions**

### **POST `/attractions`**

**Request**

لا يوجد Body في الـ Collection.

**Response 201**

{  
  "success": true,  
  "message": "string",  
  "data": "string"  
}

**Response 401**

{  
  "message": "string"  
}

**Response 422**

{  
  "message": "string",  
  "errors": {  
    "key\_0": \[  
      "string",  
      "string"  
    \]  
  }  
}

### **PUT `/attractions/{id}`**

**Request**

لا يوجد Body في الـ Collection.

**Response 200**

{  
  "success": true,  
  "message": "string",  
  "data": "string"  
}

**Response 401**

{  
  "message": "string"  
}

**Response 404**

{  
  "success": false,  
  "message": "string"  
}

**Response 422**

{  
  "message": "string",  
  "errors": {  
    "key\_0": \[  
      "string",  
      "string"  
    \]  
  }  
}

### **DELETE `/attractions/{id}`**

**Response 200**

{  
  "success": false,  
  "message": "string"  
}  
---

# **7\. Cities**

### **POST `/cities`**

**Request**

لا يوجد Body في الـ Collection.

**Response 201**

string

**Response 401**

{  
  "message": "string"  
}

**Response 422**

{  
  "message": "string",  
  "errors": {  
    "key\_0": \[  
      "string",  
      "string"  
    \]  
  }  
}

### **PUT `/cities/{id}`**

**Request**

لا يوجد Body في الـ Collection.

**Response 200**

string

**Response 401**

{  
  "message": "string"  
}

**Response 422**

{  
  "message": "string",  
  "errors": {  
    "key\_0": \[  
      "string",  
      "string"  
    \]  
  }  
}

### **DELETE `/cities/{id}`**

**Response 200**

{  
  "message": "string"  
}

**Response 401**

{  
  "message": "string"  
}  
---

# **8\. Categories**

### **POST `/categories`**

**Request**

{  
  "name": "string"  
}

**Response 201**

string

**Response 401**

{  
  "message": "string"  
}

**Response 422**

{  
  "message": "string",  
  "errors": {  
    "key\_0": \[  
      "string",  
      "string"  
    \]  
  }  
}

### **PUT `/categories/{id}`**

**Request**

{  
  "name": "string"  
}

**Response 200**

string

**Response 401**

{  
  "message": "string"  
}

**Response 404**

{  
  "message": "string"  
}

**Response 422**

{  
  "message": "string",  
  "errors": {  
    "key\_0": \[  
      "string",  
      "string"  
    \]  
  }  
}

### **DELETE `/categories/{id}`**

**Response 200**

{  
  "message": "string"  
}  
---

# **9\. Contact Messages**

### **GET `/contact-messages`**

**Response 200**

\[  
  {  
    "id": 8942,  
    "user\_id": 7218,  
    "message": "string",  
    "status": "string",  
    "created\_at": "1951-07-24T11:57:11.611Z",  
    "updated\_at": null  
  },  
  {  
    "id": 4663,  
    "user\_id": 4833,  
    "message": "string",  
    "status": "string",  
    "created\_at": null,  
    "updated\_at": "1995-12-09T22:26:34.553Z"  
  }  
\]

### **GET `/contact-messages/{id}`**

**Response 200**

{  
  "id": 4258,  
  "user\_id": 4798,  
  "message": "string",  
  "status": "string",  
  "created\_at": "1962-04-05T23:13:38.059Z",  
  "updated\_at": "1978-04-20T15:32:26.246Z"  
}

### **PUT `/contact-messages/{id}`**

**Request**

{  
  "status": "pending"  
}

**Response 200**

{  
  "message": "string",  
  "data": {  
    "id": 7551,  
    "user\_id": 5962,  
    "message": "string",  
    "status": "string",  
    "created\_at": null,  
    "updated\_at": "2013-02-28T14:36:04.212Z"  
  }  
}

### **DELETE `/contact-messages/{id}`**

**Response 200**

{  
  "message": "string"  
}  
---

# **10\. Reviews**

### **GET `/reviews`**

**Response 200**

string

**Response 401**

{  
  "message": "string"  
}

### **PUT `/reviews/{id}/approve`**

**Request**

لا يوجد Body.

**Response 200**

{  
  "message": "string"  
}

### **PUT `/reviews/{id}/reject`**

**Request**

لا يوجد Body.

**Response 200**

{  
  "message": "string"  
}

### **DELETE `/reviews/{id}`**

**Response 200**

{  
  "message": "string"  
}  
---

# **11\. Users**

### **GET `/users`**

**Response 200**

string

### **GET `/users/{id}`**

**Response 200**

string

### **POST `/users`**

**Request**

{  
  "name": "string",  
  "email": "OHf5@HSiNZPSaMepFzsoKC.jy",  
  "password": "stringstring",  
  "age": null,  
  "dist\_country": null,  
  "gender": "male",  
  "role": "admin",  
  "phone\_num": null  
}

**Response 201**

string

### **PUT `/users/{id}`**

**Request**

{  
  "name": "string",  
  "email": "wj1IB5JOofdC@amZrFiY.samy",  
  "password": "stringstring",  
  "age": null,  
  "dist\_country": null,  
  "gender": null,  
  "role": "t\_guide",  
  "phone\_num": "string"  
}

**Response 200**

string

### **DELETE `/users/{id}`**

**Response 200**

{  
  "message": "string"  
}

### **PATCH `/users/{id}/status`**

**Request**

لا يوجد Body في الـ Collection.

**Response 200**

string  
---

# **12\. Bookings**

### **GET `/bookings`**

**Response 200**

{  
  "data": \[  
    {  
      "id": 586,  
      "user": {  
        "id": 6272,  
        "name": "string",  
        "email": "string"  
      },  
      "trip": {  
        "id": 201,  
        "destination": "string",  
        "travel\_style": "string",  
        "num\_days": "string"  
      },  
      "total\_price": "string",  
      "status": "string",  
      "created\_at": null,  
      "updated\_at": null  
    }  
  \]  
}

### **GET `/bookings/{id}`**

**Response 200**

{  
  "data": {  
    "id": 453,  
    "user": {  
      "id": 6929,  
      "name": "string",  
      "email": "string"  
    },  
    "trip": {  
      "id": 1822,  
      "destination": "string",  
      "travel\_style": "string",  
      "num\_days": "string"  
    },  
    "total\_price": "string",  
    "status": "string",  
    "created\_at": "1970-01-09T14:29:31.202Z",  
    "updated\_at": null  
  }  
}

### **PUT `/bookings/{id}`**

**Request**

{  
  "status": "pending"  
}

**Response 200**

{  
  "message": "string",  
  "data": {  
    "id": 1189,  
    "user": {  
      "id": 7880,  
      "name": "string",  
      "email": "string"  
    },  
    "trip": {  
      "id": 8425,  
      "destination": "string",  
      "travel\_style": "string",  
      "num\_days": "string"  
    },  
    "total\_price": "string",  
    "status": "string",  
    "created\_at": null,  
    "updated\_at": null  
  }  
}

### **DELETE `/bookings/{id}`**

**Response 200**

{  
  "message": "string"  
}  
---

# **13\. Authentication**

### **POST `/auth/register`**

**Request**

{  
  "name": "string",  
  "email": "Skj774BxLNvi3wV@qIIfiK.bm",  
  "password": "string",  
  "age": "string",  
  "dist\_country": "string",  
  "gender": "string",  
  "phone\_num": "string",  
  "password\_confirmation": "string"  
}

**Response 201**

{  
  "message": "string"  
}

**Response 422**

\[  
  "",  
  ""  
\]  
---

### **POST `/auth/login`**

**Request**

{  
  "email": "F4MJ-ZuHq00lXeV@fLBCiqXerVgytywtiNpwIDtIeBOsdvwF.rdhh",  
  "password": "string"  
}

**Response 200**

{  
  "message": "string",  
  "token": "string",  
  "token\_type": "string",  
  "expires\_in": "string"  
}

**Response 401**

{  
  "error": "string"  
}

**Response 403**

{  
  "message": "string"  
}

**Response 422**

{  
  "message": "string",  
  "errors": {  
    "key\_0": \[  
      "string",  
      "string"  
    \]  
  }  
}  
---

### **POST `/auth/forget-password`**

**Request**

{  
  "email": "qkr8zzqfnFyu@Fuwxea.cpt"  
}

**Response 200**

{  
  "message": "string"  
}

**Response 422**

{  
  "message": "string",  
  "errors": {  
    "key\_0": \[  
      "string",  
      "string"  
    \]  
  }  
}  
---

### **POST `/auth/reset-password/{token}/{email}`**

**Request**

{  
  "email": "12q29qHVxIdm@KQItJrArqrSeDeVf.aoa",  
  "token": "string",  
  "password": "stringstring",  
  "password\_confirmation": "stringstring"  
}

**Response 200**

string

**Response 422**

{  
  "message": "string",  
  "errors": {  
    "key\_0": \[  
      "string",  
      "string"  
    \]  
  }  
}  
---

### **GET `/auth/email/verify/{id}/{hash}`**

**Response 200**

{  
  "message": "string"  
}

**Response 403**

{  
  "error": "string"  
}  
---

### **POST `/auth/email/resend`**

**Request**

{  
  "email": "qkr8zzqfnFyu@Fuwxea.cpt"  
}

**Response 200**

{  
  "message": "string"  
}

**Response 400**

{  
  "message": "string"  
}

**Response 422**

\[  
  "",  
  ""  
\]  
---

### **GET `/auth/email/status`**

**Request**

GET /auth/email/status?email=SiaZ1opr4@sWPSjqnmarF.qvr

**Response 200**

{  
  "verified": true  
}

**Response 422**

\[  
  "",  
  ""  
\]  
