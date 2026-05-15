<?php

class ProductoService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function getAll(?string $categoria = null, ?string $tipo = null, ?string $search = null): array {
        $sql = "SELECT p.*, c.nombre AS categoria_nombre, c.slug AS categoria_slug
                FROM productos p
                INNER JOIN categorias c ON p.categoria_id = c.id
                WHERE p.activo = 1";
        $params = [];

        if ($categoria !== null && $categoria !== '') {
            $sql .= " AND c.slug = :categoria";
            $params[':categoria'] = $categoria;
        }

        if ($tipo !== null && $tipo !== '') {
            $sql .= " AND p.tipo = :tipo";
            $params[':tipo'] = $tipo;
        }

        if ($search !== null && $search !== '') {
            $sql .= " AND (p.nombre LIKE :search OR p.descripcion LIKE :search OR p.nota_olfativa LIKE :search)";
            $params[':search'] = '%' . $search . '%';
        }

        $sql .= " ORDER BY p.created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare(
            "SELECT p.*, c.nombre AS categoria_nombre, c.slug AS categoria_slug
             FROM productos p
             INNER JOIN categorias c ON p.categoria_id = c.id
             WHERE p.id = :id"
        );
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch();
        return $result !== false ? $result : null;
    }

    public function create(array $data): array {
        $stmt = $this->db->prepare(
            "INSERT INTO productos (categoria_id, nombre, descripcion, nota_olfativa, precio, stock, imagen_url, tipo, activo)
             VALUES (:categoria_id, :nombre, :descripcion, :nota_olfativa, :precio, :stock, :imagen_url, :tipo, :activo)"
        );
        $stmt->execute([
            ':categoria_id'   => $data['categoria_id'],
            ':nombre'         => $data['nombre'],
            ':descripcion'    => $data['descripcion']    ?? null,
            ':nota_olfativa'  => $data['nota_olfativa']  ?? null,
            ':precio'         => $data['precio'],
            ':stock'          => $data['stock']          ?? 0,
            ':imagen_url'     => $data['imagen_url']     ?? null,
            ':tipo'           => $data['tipo']           ?? 'original',
            ':activo'         => isset($data['activo']) ? (int)$data['activo'] : 1,
        ]);
        $id = (int)$this->db->lastInsertId();
        return $this->getById($id);
    }

    public function update(int $id, array $data): ?array {
        $fields = [];
        $params = [':id' => $id];

        $allowed = ['categoria_id','nombre','descripcion','nota_olfativa','precio','stock','imagen_url','tipo','activo'];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "`{$field}` = :{$field}";
                $params[":{$field}"] = $data[$field];
            }
        }

        if (empty($fields)) {
            return $this->getById($id);
        }

        $sql = "UPDATE productos SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $this->getById($id);
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("UPDATE productos SET activo = 0 WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public function checkStock(int $id, int $cantidad): bool {
        $stmt = $this->db->prepare("SELECT stock FROM productos WHERE id = :id AND activo = 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) return false;
        return (int)$row['stock'] >= $cantidad;
    }
}
